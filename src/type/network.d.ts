export interface Feature {
  property: string;
  desc: string;
}
export interface Node {
  id: string;
  level: number;
  clusterId?: string;
  [key: string]: unknown;
}
export interface Cluster extends Node {
  nodes: string[];
  count: number;
  features?: string[];
  taskId?: string;
}
export interface EdgeBase {
  source: string;
  target: string;
}
export interface Edge extends EdgeBase {
  [key: string]: unknown;
}
export interface CrossLevelEdge extends Edge {
  nid: string;
  cid: string;
}

export interface ClusterEdge extends Edge {
  count: number;
}
export type Network = {
  nodes: Node[];
  edges: Edge[];
}
export type IdNetwork = {
  nodes: string[];
  edges: EdgeBase[];
}
export type LayerNetwork = (Network | undefined)[];

export type NodeMap = Map<string, Node>;
export type EdgeMap = Map<string, Edge>;
