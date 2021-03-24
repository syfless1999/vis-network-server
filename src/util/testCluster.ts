import { Network, LayerNetwork, Features } from "src/type/network";
import labelPropagation from 'src/algorithm/label-propagation';
import { cronDebug } from "./debug";
import { Cluster } from "src/algorithm/label-propagation/types";

/**
 * 
 * @param net source nodes and edges
 * @param depth target cluster depth, >= 1
 */
export const testClusterLayerNetwork = (
  net: Network,
  maxLevel: number = 10,
): LayerNetwork => {
  let currentLevel = 1, currentNetwork: Network = net;
  const layerNetwork = [net];
  while (currentNetwork.nodes.length > 10 && currentLevel < maxLevel) {
    currentNetwork = testClusterNetwork(currentNetwork, currentLevel);
    layerNetwork.push(currentNetwork);
    cronDebug(` cluster data FIN [level: ${currentLevel}, clusters: ${currentNetwork.nodes.length}, clusterEdges: ${currentNetwork.edges.length}]`);
    currentLevel += 1;
  }
  return layerNetwork;
}

export const analyseFeatureOfCluster = (c: Cluster): Features => {
  // TODO
  return {};
}
export const features2String = (fs: Features): string[] => {
  // TODO
  return [];
}
export const testClusterNetwork = (net: Network, depth: number = 1): Network => {
  const targetLevel = net.nodes.length ? net.nodes[0].level + 1 : 0;
  const lpaResult = labelPropagation(
    net,
    true,
    undefined,
    undefined,
    (_, i) => `${depth}_${i}`,
  );
  const clusterResult: Network = {
    nodes: [],
    edges: [],
  };
  const { clusters, clusterEdges } = lpaResult;
  clusters.forEach(cluster => {
    const feats = analyseFeatureOfCluster(cluster);
    const featStrs = features2String(feats);
    const nodes = cluster.nodes.map(node => node.id);
    clusterResult.nodes.push({
      id: cluster.id,
      nodes,
      level: targetLevel,
      features: featStrs,
      count: cluster.count,
    });
  });

  clusterEdges.forEach(edge => {
    // TODO
    // need to exclude circle edge?
    // if (edge.source === edge.target) return;
    clusterResult.edges.push({
      source: edge.source,
      target: edge.target,
    });
  });
  return clusterResult;
}
