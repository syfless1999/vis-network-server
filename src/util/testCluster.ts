import { Node, HeadCluster, Layer, LayerNetwork } from "src/type/network";
import labelPropagation from 'src/algorithm/label-propagation';
import { isHeadCluster, nodes2Map } from "./network";

/**
 * 
 * @param layer source nodes and edges
 * @param depth target cluster depth, >= 1
 */
export const testClusterNetwork = (
  layer: Layer<Node>,
  depth: number,
): LayerNetwork => {
  const layerNetwork = [];
  let currentDepth = 1, currentLayer: Layer<Node | HeadCluster> = layer;
  do {
    layerNetwork.push(currentLayer);
    currentLayer = testClusterLayer(currentLayer, currentDepth);
  } while (currentDepth++ < depth);
  return layerNetwork;
}

export const testClusterLayer = (layer: Layer<Node | HeadCluster>, depth: number = 1): Layer<HeadCluster> => {
  const targetLevel = layer.nodes.length ? layer.nodes[0].level + 1 : 0;
  const { nodes: sourceNodes } = layer;
  const lpaResult = labelPropagation(
    layer,
    true,
    undefined,
    undefined,
    (_, i) => `${depth}_${i}`,
  );
  const clusterResult: Layer<HeadCluster> = {
    nodes: [],
    edges: [],
  };
  const { clusters, clusterEdges } = lpaResult;
  clusters.forEach(cluster => {
    const nodes = cluster.nodes.map(node => node.id);
    clusterResult.nodes.push({
      id: cluster.id,
      nodes,
      level: targetLevel,
      features: ['sex male 80%', 'age old 50%', 'name shang 10%'],
      count: cluster.count,
    });
  });

  clusterEdges.forEach(edge => {
    if (edge.source === edge.target) return;
    clusterResult.edges.push({
      source: edge.source,
      target: edge.target,
      count: 0,
    });
  });
  return clusterResult;
}
