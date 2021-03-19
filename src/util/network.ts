import { Node, Cluster, Edge, ClusterEdge, NodeMap } from "src/type/network";

export const isNode = (c: unknown): c is Node => typeof c === 'object' && c != null && 'id' in c;
export const isCluster = (c: unknown): c is Cluster => isNode(c) && 'nodes' in c;
export const isHeadCluster = (c: unknown) => isCluster(c) && !('clusterId' in c);
export const isClusterEdge = (e: Edge): e is ClusterEdge => 'count' in e;

type RNetworkArray = Node[] | RNetworkArray[];
export const nodes2Map = (cs: RNetworkArray, map?: NodeMap) => {
  const cmap = map || new Map<string, Node>();
  cs.forEach((c: (Node | RNetworkArray)) => {
    if (Array.isArray(c)) {
      nodes2Map(c, cmap);
    } else {
      cmap.set(c.id, c);
    }
  });
  return cmap;
};
