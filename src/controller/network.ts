import * as network from 'src/type/network';
import networkData from 'src/mock/networkData.json';
import { readConnectedNeighbourClusterNetworkMap, readDirectlyConnectedNodeNetworkMap, readNodesById, readPartNetwork } from 'src/service/network';
import { readOneTask } from 'src/service/task';
import { Network } from 'src/type/network';
import { Controller } from 'src/type/express';
import { array2Map, uniqueArray } from 'src/util/array';
import { getJoinString } from 'src/util/string';

export const read: Controller = async (req, res, next) => {
  try {
    res.json({
      message: 'success',
      data: networkData as network.LayerNetwork,
    })
  } catch (error) {
    next(error);
  }
}

export const readNetwork: Controller = async (req, res, next) => {
  try {
    const { query } = req;
    const queryLevel = query.level;
    const taskId = `${query.taskId}`;
    const task = await readOneTask(taskId);
    const { dataSource, progress } = task;
    const { name } = dataSource[0];
    if (task == null) {
      throw new Error(`There is no task which's id is ${taskId}`);
    }
    if (progress < 100) {
      throw new Error('This task has not been finished.');
    }
    const level = queryLevel == undefined || Number(queryLevel) < 0 ? task.largestLevel : Number(queryLevel);
    let layer: Network;
    layer = await readPartNetwork(name, level, taskId, 60);
    const layerNetwork: network.LayerNetwork = Array.from({ length: task.largestLevel + 1 });
    layerNetwork[level] = layer;
    res.json({
      message: 'success',
      data: layerNetwork,
    })
  } catch (error) {
    next(error);
  }
}

export const completeNetwork: Controller = async (req, res, next) => {
  try {
    const { body } = req;
    const label: string = body.label;
    const taskId: string = body.taskId;
    const ids: string[] = body.ids;
    const idNetwork: network.IdNetwork = body.idNetwork;
    const { nodes, edges } = idNetwork;

    // 1 nodes need to append on the network
    const newNodes = await readNodesById(ids, label, taskId);
    const allNodeIds = [
      ...nodes,
      ...newNodes.map((n) => n.id),
    ];
    const newEdges: network.EdgeBase[] = [];
    const nodeMap = array2Map(allNodeIds, (id) => id);
    const edgeMap = array2Map(edges, (e) => getJoinString(e.source, e.target));

    // 2 edge 
    // 2.1 same level edge
    const slNetworkMap = await readDirectlyConnectedNodeNetworkMap(allNodeIds, label, taskId);
    for (const id of slNetworkMap.keys()) {
      const network = slNetworkMap.get(id);
      const { edges: slEdges } = network;
      slEdges.forEach((e) => {
        const { source, target } = e;
        if (!nodeMap.has(source) || !nodeMap.has(target)) return;
        const edgeId = getJoinString(source, target);
        if (!edgeMap.has(edgeId)) {
          newEdges.push(e);
          edgeMap.set(edgeId, e);
        }
      });
    }
    // 2.2 cross level edge
    const clNetworkMap = await readConnectedNeighbourClusterNetworkMap(allNodeIds, label, taskId);
    for (const k of clNetworkMap.keys()) {
      const { edges: clEdges } = clNetworkMap.get(k);
      clEdges.forEach((e) => {
        let { nid, cid, source, target } = e;
        if (!nodeMap.has(cid)) return;
        if (source === nid) {
          target = cid;
        } else {
          source = cid;
        }
        const edgeId = getJoinString(source, target);
        if (edgeMap.has(edgeId)) return;
        const newEdge = { source, target };
        newEdges.push(newEdge);
        edgeMap.set(edgeId, newEdge);
      });
    }

    res.json({
      message: 'success',
      data: {
        nodes: newNodes,
        edges: newEdges,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const readAroundNetwork: Controller = async (req, res, next) => {
  const label = `${req.query.label}`;
  const taskId = `${req.query.taskId}`;
  const nodeId = `${req.query.nodeId}`;

  const resNet: Network = { nodes: [], edges: [] };
  const { nodes, edges } = resNet;

  try {
    // 1. read target node
    // 2. read directly connected same level network
    // 3. read directly connected cross level network
    const [sNodes, slNetMap, clNetMap] = await Promise.all([
      readNodesById([nodeId], label, taskId),
      readDirectlyConnectedNodeNetworkMap([nodeId], label, taskId),
      readConnectedNeighbourClusterNetworkMap([nodeId], label, taskId),
    ]);
    if (!sNodes.length) throw new Error('no node match this id');

    nodes.push(sNodes[0]);
    if (slNetMap.has(nodeId)) {
      const slNet = slNetMap.get(nodeId);
      slNet.nodes.forEach(n => nodes.push(n));
      slNet.edges.forEach(e => edges.push(e));
    }
    if (clNetMap.has(nodeId)) {
      const clNet = clNetMap.get(nodeId);
      clNet.nodes.forEach(n => nodes.push(n));
      clNet.edges.forEach(e => {
        let { nid, cid, source, target } = e;
        if (source === nid) {
          target = cid;
        } else {
          source = cid;
        }
        edges.push({ source, target });
      });
    }

    res.json({
      message: 'success',
      data: {
        nodes: uniqueArray(nodes, (v) => v.id),
        edges: uniqueArray(edges, (e) => getJoinString(e.source, e.target)),
      },
    });

  } catch (error) {
    next(error);
  }
}