import { runTransaction } from 'src/db/neo4jDriver';
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

export const retrieveSourceNetwork = async (label: string): Promise<Layer<Node>> => {
  const result: Layer<Node> = {
    nodes: [],
    edges: [],
  };
  await runTransaction(async (txc) => {
    // retrieve node
    const nodes = await txc.run(
      `Match (node:${label} {level:$level}) Return node`, {
      level: 0,
    });
    nodes.records.forEach(record => {
      const node = record.get('node');
      result.nodes.push({
        ...node.properties,
      });
    });
    // retrieve edge
    const edges = await txc.run(
      `Match (n1:${label} {level:$level})-[edge]->(n2:${label} {level:$level}) Return Distinct edge`, {
      level: 0,
    });
    edges.records.forEach(record => {
      const edge = record.get('edge');
      result.edges.push(edge.properties);
    });
  });
  return result;
}

export const retrieveNetworkByTaskIdAndLevel = async (taskId: string, level: number): Promise<Layer<Node>> => {
  // TODO
  const result: Layer<Node> = {
    nodes: [],
    edges: [],
  };
  await runTransaction(async (txc) => {
    // retrieve node
    const nodes = await txc.run(`Match (node {level:${level}, taskId:'${taskId}'}) Return node`);
    nodes.records.forEach(record => {
      const node = record.get('node');
      result.nodes.push({
        ...node.properties,
      });
    });
    // retrieve edge
    const edges = await txc.run(
      `Match (n1 {level:${level}, taskId:'${taskId}'})-[edge]->(n2 {level:${level}, taskId:'${taskId}'}) Return Distinct edge`);
    edges.records.forEach(record => {
      const edge = record.get('edge');
      result.edges.push(edge.properties);
    });
  });
  return result;
};
