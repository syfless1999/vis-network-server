import { Network, LayerNetwork, Features, ClusterNetwork } from "src/type/network";
import labelPropagation from 'src/algorithm/label-propagation';
import { cronDebug } from "./debug";
import { Cluster } from "src/algorithm/label-propagation/types";
import { isCluster, isNode } from "./network";

/**
 * 
 * @param net source nodes and edges
 * @param maxLevel largest level restriction
 */
export const testClusterLayerNetwork = (
  net: Network,
  props: string[],
  maxLevel: number = 10,
): LayerNetwork => {
  let currentLevel = 1, currentNetwork: Network = net;
  const layerNetwork = [net];
  while (currentNetwork.nodes.length > 10 && currentLevel < maxLevel) {
    currentNetwork = testClusterNetwork(currentNetwork, currentLevel, props);
    layerNetwork.push(currentNetwork);
    cronDebug(` cluster data FIN [level: ${currentLevel}, clusters: ${currentNetwork.nodes.length}, clusterEdges: ${currentNetwork.edges.length}]`);
    currentLevel += 1;
  }
  return layerNetwork;
}

export const analyseFeatureOfCluster = (c: Cluster, props: string[]): Features => {
  const { nodes } = c;
  const features: Features = {};
  props.forEach(prop => {
    features[prop] = {};
  });
  nodes.forEach(n => {
    if (isCluster(n)) {
      const feats = strings2Features(n.features);
      Object.keys(feats).forEach((key) => {
        const descs = feats[key];
        Object.keys(descs).forEach((k) => {
          if (!features[key][k]) {
            features[key][k] = 0;
          }
          features[key][k] += descs[k];
        });
      });
    } else if (isNode(n)) {
      props.forEach(prop => {
        const value = n[prop];
        const feat = features[prop];
        if (value == undefined) return;
        const valueStr = `${value}`;
        if (feat[valueStr] == undefined) {
          feat[valueStr] = 0;
        }
        feat[valueStr] += 1;
      });
    }
  });
  return features;
}
export const features2Strings = (fs: Features): string => {
  const featStr: string[] = [];
  Object.keys(fs).forEach(key => {
    const feat = fs[key];
    let str = `${key} ` + Object.keys(feat).map(prop => `[${prop} ${feat[prop]}]`).join(' ');
    featStr.push(str);
  });
  return featStr.join(' ');
}
export const strings2Features = (str: string): Features => {
  const feats: Features = {};
  const descs = str.match(/\S+( \[\S+ \d+\])+/g);
  descs.forEach(desc => {
    const [prop] = desc.match(/^\w+/g);
    feats[prop] = {};
    const features = desc.match(/\[\S+ \d+\]/g);
    features.forEach(f => {
      f = f.slice(1, f.length - 1);
      const [p, count] = f.split(' ');
      feats[prop][p] = Number(count);
    })
  });
  return feats;
};
export const testClusterNetwork = (
  net: Network,
  depth: number = 1,
  props: string[]
): Network => {
  const targetLevel = net.nodes.length ? net.nodes[0].level + 1 : 0;
  const lpaResult = labelPropagation(
    net,
    true,
    undefined,
    undefined,
    (_, i) => `${depth}_${i}`,
  );
  const clusterResult: ClusterNetwork = {
    nodes: [],
    edges: [],
  };
  const { clusters, clusterEdges } = lpaResult;
  clusters.forEach(cluster => {
    const feats = analyseFeatureOfCluster(cluster, props);
    const featStr = features2Strings(feats);
    const nodes = cluster.nodes.map(node => node.id);
    clusterResult.nodes.push({
      id: cluster.id,
      nodes,
      level: targetLevel,
      features: featStr,
      count: cluster.count,
    });
  });

  clusterEdges.forEach(edge => {
    // if (edge.source === edge.target) return;
    clusterResult.edges.push({
      source: edge.source,
      target: edge.target,
    });
  });
  return clusterResult;
}
