import { runTransaction } from "src/db/neo4jDriver";
import { Node, HeadCluster, Edge, Layer } from "src/type/network";

export const saveNodes = async (nodes: (Node | HeadCluster)[], name: string) => {
  await runTransaction(async (txc) => {
    const nodeCreateTasks = nodes.map((node: Node) => {
      txc.run(`CREATE (n:${name} $node)`, { node });
    });
    await Promise.all(nodeCreateTasks);
  });
};

export const saveEdges = async (edges: Edge[], name: string) => {
  await runTransaction(async (txc) => {
    const edgeCreateTasks = edges.map(
      (edge) => {
        const { type, ...params } = edge;
        return txc.run(
          `Match (s1:${name} {id:$source}),(s2:${name} {id:$target}) Create (s1)-[r:${type} $params]->(s2)`, {
          source: params.source,
          target: params.target,
          params,
        });
      });
    await Promise.all(edgeCreateTasks);
  });
};

export const saveLayer = async (layer: Layer<Node | HeadCluster>, name: string) => {
  await Promise.all([
    saveNodes(layer.nodes, name),
    saveEdges(layer.edges, name),
  ]);
}