import { Node, Cluster, Edge, ClusterEdge } from "src/type/network";

export const isNode = (c: unknown): c is Node => typeof c === 'object' && c != null && 'id' in c;
export const isCluster = (c: unknown): c is Cluster => isNode(c) && 'nodes' in c;
export const isHeadCluster = (c: unknown) => isCluster(c) && !('clusterId' in c);
export const isClusterEdge = (e: Edge): e is ClusterEdge => 'count' in e;