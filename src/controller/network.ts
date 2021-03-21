import * as network from 'src/type/network';
import networkData from 'src/mock/networkData.json';
import { retrieveDirectlyConnectedNeighbourClusterEdgeMap, retrieveDirectlyConnectedEdgeMap, retrieveNodesById, retrievePartNetwork } from 'src/service/network';
import { retrieveOneTask } from 'src/service/task';
import { Network } from 'src/type/network';
import { Controller } from 'src/type/express';
import { array2Map } from 'src/util/array';
import { getJoinString } from 'src/util/string';

/**
 * http [ temporary ]
 * @param req 
 * @param res 
 * @param next 
 */
export const retrieve: Controller = async (req, res, next) => {
  try {
    res.json({
      message: 'success',
      data: networkData as network.LayerNetwork,
    })
  } catch (error) {
    next(error);
  }
}

/**
 * http
 * @param req 
 * @param res 
 * @param next 
 */
export const retrieveLayer: Controller = async (req, res, next) => {
  try {
    const { params: { taskId }, query: { level: queryLevel } } = req;
    const task = await retrieveOneTask(taskId);
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
    layer = await retrievePartNetwork(name, level, taskId);
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

export const completeLayer: Controller = async (req, res, next) => {
  try {
    const { body } = req;
    const label: string = body.label;
    const taskId: string = body.taskId;
    const ids: string[] = body.ids;
    const idNetwork: network.IdNetwork = body.idNetwork;
    const { nodes, edges } = idNetwork;

    // 1 nodes need to append on the network
    const newNodes = await retrieveNodesById(label, taskId, ids);
    const allNodeIds = [
      ...nodes,
      ...newNodes.map((n) => n.id),
    ];
    const newEdges: network.EdgeBase[] = [];
    const nodeMap = array2Map(allNodeIds, (id) => id);
    const edgeMap = array2Map(edges, (e) => getJoinString(e.source, e.target));

    // 2 edge 
    // 2.1 same level edge
    const slEdgeMap = await retrieveDirectlyConnectedEdgeMap(allNodeIds, label, taskId);
    for (const k of slEdgeMap.keys()) {
      const slEdges = slEdgeMap.get(k);
      slEdges.forEach((e) => {
        const { source, target } = e;
        if (!nodeMap.has(source) || !nodeMap.has(target)) return;
        const edgeId = getJoinString(source, target);
        if (!edgeMap.has(edgeId)) {
          newEdges.push(e);
          edgeMap.set(edgeId, e);
        }
      })
    }
    // 2.2 cross level edge
    const clEdgeMap = await retrieveDirectlyConnectedNeighbourClusterEdgeMap(allNodeIds, label, taskId);
    for (const k of clEdgeMap.keys()) {
      const clEdges = clEdgeMap.get(k);
      clEdges.forEach((e) => {
        let { nid, cid, source, target } = e;
        if (nodeMap.has(cid)) {
          if (source === nid) {
            target = cid;
          } else {
            source = cid;
          }
          const edgeId = getJoinString(source, target);
          if (!edgeMap.has(edgeId)) {
            const newEdge = { source, target };
            newEdges.push(newEdge);
            edgeMap.set(edgeId, newEdge);
          }
        }
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
