// source data

export interface Feature {
  property: string;
  desc: string;
}
export interface Community {
  id: string;
  [key: string]: unknown;
  level: number;
  features: string[];
}
export interface Node extends Community {
  clusterId: string;
}
export interface HeadCluster extends Community {
  nodes: string[];
  count: number;
  taskId?: string;
}
export interface Cluster extends Node, HeadCluster { }
export interface Edge {
  source: string;
  target: string;
  [key: string]: unknown;
}
export interface ClusterEdge extends Edge {
  count: number;
}
export type Layer<T extends Node | HeadCluster> = {
  nodes: T[];
  edges: (T extends HeadCluster ? ClusterEdge : Edge)[];
}
export type LayerNetwork = (Layer<HeadCluster | Node> | undefined)[];

// front-end data
export interface DisplayNetwork {
  nodes: (Node | HeadCluster)[];
  edges: Edge[];
}
export type NodeMap = Map<string, Node | HeadCluster>;
export type EdgeMap = Map<string, Edge>;
