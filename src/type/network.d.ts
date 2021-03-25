export interface Feat {
  [feat: string]: number;
}
export interface Features {
  [prop: string]: Feat;
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
  features?: string;
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
  count?: number;
}
export interface Network {
  nodes: Node[];
  edges: Edge[];
}
export interface ClusterNetwork extends Network {
  nodes: Cluster[];
  edges: ClusterEdge[];
}
export type IdNetwork = {
  nodes: string[];
  edges: EdgeBase[];
}
export type LayerNetwork = (Network | undefined)[];

export type NodeMap = Map<string, Node>;
export type EdgeMap = Map<string, Edge>;
