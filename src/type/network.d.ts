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
export interface Edge {
  source: string;
  target: string;
  [key: string]: unknown;
}
export interface ClusterEdge extends Edge {
  count: number;
}
export type Layer = {
  nodes: Node[];
  edges: Edge[];
}
export type LayerNetwork = (Layer | undefined)[];

export interface DisplayNetwork {
  nodes: Node[];
  edges: Edge[];
}
export type NodeMap = Map<string, Node>;
export type EdgeMap = Map<string, Edge>;
