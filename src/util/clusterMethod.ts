export interface HClusterInterface {
  add: (a: number, b: number) => number;
}

const HCluster: HClusterInterface = require('bindings')('hierarchical-cluster')

export default HCluster;