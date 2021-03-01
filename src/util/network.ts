import { Node, HeadCluster, Cluster, Edge, ClusterEdge, Community, NodeMap } from "src/type/network";

export const isNode = (c: Community): c is Node => 'clusterId' in c && !('nodes' in c);
export const isHeadCluster = (c: Community): c is HeadCluster => 'nodes' in c;
export const isCluster = (c: Community): c is Cluster => 'clusterId' in c && 'nodes' in c;
export const isHead = (c: Community): c is HeadCluster => isHeadCluster(c) && !('clusterId' in c);
export const isClusterEdge = (e: Edge): e is ClusterEdge => 'count' in e;

type RNetworkArray = (Node | HeadCluster)[] | RNetworkArray[];
export const nodes2Map = (cs: RNetworkArray, map?: NodeMap) => {
  const cmap = map || new Map<string, Node | HeadCluster>();
  cs.forEach((c: (Node | HeadCluster | RNetworkArray)) => {
    if (Array.isArray(c)) {
      nodes2Map(c, cmap);
    } else {
      cmap.set(c.id, c);
    }
  });
  return cmap;
};
