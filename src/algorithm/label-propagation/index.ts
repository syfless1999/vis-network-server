
import { uniqueId } from 'src/util/string';

import getAdjMatrix from './adjacent-matrix';
import { GraphData, ClusterData, Cluster, EdgeConfig, NodeIndexMap } from './types';

/**
 * 标签传播算法
 * @param graphData 图数据
 * @param directed 是否有向图，默认为 false
 * @param weightPropertyName 权重的属性字段
 * @param maxIteration 最大迭代次数
 */
const labelPropagation = (
  graphData: GraphData,
  directed: boolean = false,
  weightPropertyName: string = 'weight',
  maxIteration: number = 100,
  customizeId?: (oldId: string, index: number) => string,
): ClusterData => {
  // the origin data
  const { nodes = [], edges = [] } = graphData;

  const clusters: { [id: string]: Cluster } = {};
  const nodeMap: NodeIndexMap = {};
  // init the clusters and nodeMap
  nodes.forEach((node) => {
    const cid: string = uniqueId();
    node.clusterId = cid;
    clusters[cid] = {
      id: cid,
      nodes: [node],
      count: 0,
    };
    nodeMap[node.id] = node;
  });

  // the adjacent matrix of calNodes inside clusters
  const adjMatrix = getAdjMatrix(graphData, directed);
  // the sum of each row in adjacent matrix
  const ks = [];
  /**
   * neighbor nodes (id for key and weight for value) for each node
   * neighbors = {
   *  id(node_id): { id(neighbor_1_id): weight(weight of the edge), id(neighbor_2_id): weight(weight of the edge), ... },
   *  ...
   * }
   */
  const neighbors: { [iid: string]: { [jid: string]: number; }; } = {};
  adjMatrix.forEach((row, i) => {
    let k = 0;
    const iid = nodes[i].id;
    neighbors[iid] = {};
    row.forEach((entry, j) => {
      if (!entry) return;
      k += entry;
      const jid = nodes[j].id;
      neighbors[iid][jid] = entry;
    });
    ks.push(k);
  });

  let iter = 0;

  while (iter < maxIteration) {
    let changed = false;
    nodes.forEach(node => {
      const neighborClusters: { [clusterId: string]: number } = {};
      Object.keys(neighbors[node.id]).forEach(neighborId => {
        const neighborWeight = neighbors[node.id][neighborId];
        const neighborNode = nodeMap[neighborId];
        const neighborClusterId = neighborNode.clusterId;
        if (!neighborClusterId) return;
        if (!neighborClusters[neighborClusterId]) neighborClusters[neighborClusterId] = 0;
        neighborClusters[neighborClusterId] += neighborWeight;
      });
      // find the cluster with max weight
      let maxWeight = -Infinity;
      let bestClusterIds: string[] = [];
      Object.keys(neighborClusters).forEach(clusterId => {
        if (maxWeight < neighborClusters[clusterId]) {
          maxWeight = neighborClusters[clusterId];
          bestClusterIds = [clusterId];
        } else if (maxWeight === neighborClusters[clusterId]) {
          bestClusterIds.push(clusterId);
        }
      });
      if (bestClusterIds.length === 1 && bestClusterIds[0] === node.clusterId) return;
      const selfClusterIdx = bestClusterIds.indexOf(node.clusterId!);
      if (selfClusterIdx >= 0) bestClusterIds.splice(selfClusterIdx, 1);
      if (bestClusterIds && bestClusterIds.length) {
        changed = true;

        // remove from origin cluster
        const selfCluster = clusters[node.clusterId as string];
        const nodeInSelfClusterIdx = selfCluster.nodes.indexOf(node);
        selfCluster.nodes.splice(nodeInSelfClusterIdx, 1);

        // move the node to the best cluster
        const randomIdx = Math.floor(Math.random() * bestClusterIds.length);
        const bestCluster = clusters[bestClusterIds[randomIdx]];
        bestCluster.nodes.push(node);
        node.clusterId = bestCluster.id;
      }
    });
    if (!changed) break;
    iter++;
  }

  // delete the empty clusters
  Object.keys(clusters).forEach(clusterId => {
    const cluster = clusters[clusterId];
    if (!cluster.nodes || !cluster.nodes.length) {
      delete clusters[clusterId];
    }
  });

  // ======= NEW: id customize =======
  if (customizeId) {
    // change cluster id
    const idMap: { [oldId: string]: string } = {};
    const oldClusterIds = Object.keys(clusters);
    for (let i = 0; i < oldClusterIds.length; i += 1) {
      const oldId = oldClusterIds[i];
      const newId = customizeId(oldId, i);
      idMap[oldId] = newId;
      clusters[newId] = clusters[oldId];
      clusters[newId].id = newId;
      delete clusters[oldId];
    }

    // change node's clusterId
    nodes.forEach((node) => {
      const { clusterId } = node;
      if (clusterId) {
        node.clusterId = idMap[clusterId];
      }
    })
  }

  // ======= NEW: node count =======
  Object.keys(clusters).forEach(clusterId => {
    const cluster = clusters[clusterId];
    cluster.nodes.forEach(n => {
      const { count = 1 } = n;
      if (typeof count !== 'number') throw new Error('Node can not have property named "count".')
      cluster.count += count;
    });
  });

  // get the cluster edges
  const clusterEdges: EdgeConfig[] = [];
  const clusterEdgeMap: { [id: string]: EdgeConfig; } = {};
  edges.forEach(edge => {
    const { source, target } = edge;
    const weight = edge[weightPropertyName] || 1;
    const count = edge.count || 1;
    const sourceClusterId = nodeMap[source].clusterId;
    const targetClusterId = nodeMap[target].clusterId;

    const newEdgeId = `${sourceClusterId}---${targetClusterId}`;
    if (clusterEdgeMap[newEdgeId]) {
      clusterEdgeMap[newEdgeId].weight += weight;
      clusterEdgeMap[newEdgeId].count += count;
    } else {
      const newEdge = {
        source: sourceClusterId!,
        target: targetClusterId!,
        weight,
        count,
      };
      clusterEdgeMap[newEdgeId] = newEdge;
      clusterEdges.push(newEdge);
    }
  });

  const clustersArray: Cluster[] = [];
  Object.keys(clusters).forEach(clusterId => {
    clustersArray.push(clusters[clusterId]);
  });
  return {
    clusters: clustersArray,
    clusterEdges,
  }
}

export default labelPropagation;
