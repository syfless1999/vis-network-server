import { runTransaction } from 'src/db/neo4jDriver';
import { Node, HeadCluster, Edge, Layer, LayerNetwork } from "src/type/network";
import { uniqueArray } from 'src/util/array';
import { nodes2Map } from 'src/util/network';


export const saveNodes = async (
  nodes: (Node | HeadCluster)[],
  name: string,
) => {
  await runTransaction(async (txc) => {
    const nodeCreateTasks = nodes.map((node: Node) => {
      txc.run(`CREATE (n:${name} $node)`, {
        node,
      });
    });
    await Promise.all(nodeCreateTasks);
  });
};

export const saveEdges = async (
  edges: Edge[],
  name: string,
) => {
  await runTransaction(async (txc) => {
    const edgeSaveTasks = edges.map((edge: Edge) => {
      const { type = 'edge', ...params } = edge;
      return txc.run(
        `Match (s1:${name} {id:'${params.source}'}),(s2:${name} {id:'${params.target}'}) Create (s1)-[r:${type} $params]->(s2)`, {
        params,
      });
    });
    await Promise.all(edgeSaveTasks);
  });
};

export const saveLayer = async (layer: Layer<Node | HeadCluster>, name: string) => {
  await saveNodes(layer.nodes, name);
  await saveEdges(layer.edges, name);
}

export const retrieveCrossLayerEdges = (layers: LayerNetwork) => {
  let currentLevel = layers.length - 1;
  const edges: Edge[] = [];
  while (currentLevel > 0) {
    const currentLayer = layers[currentLevel];
    const lowLayer = layers[currentLevel - 1];
    const lowLayerMap = nodes2Map(lowLayer.nodes);
    currentLayer.nodes.forEach((node) => {
      const { id, nodes } = node;
      if (Array.isArray(nodes)) {
        nodes.forEach((nodeId) => {
          if (lowLayerMap.has(nodeId)) {
            const edge = {
              source: id,
              target: nodeId,
              type: 'include',
            };
            edges.push(edge);
          }
        })
      }
    });
    currentLevel -= 1;
  }
  return edges;
};

export const retrieveCompleteSourceNetwork = async (label: string): Promise<Layer<Node>> => {
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

export const retrievePartSourceNetwork = async (label: string, limit: number = 30): Promise<Layer<Node>> => {
  const result: Layer<Node> = {
    nodes: [],
    edges: [],
  };
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  await runTransaction(async (txc) => {
    // retrieve nodes and edges at one query
    const queryRes = await txc.run(
      `Match (node1:${label} {level:$level})-[edge]->(node2:${label} {level:$level}) return node1, node2, edge limit ${limit}`, {
      level: 0,
    });
    queryRes.records.forEach(record => {
      const node1 = record.get('node1');
      const node2 = record.get('node2');
      const edge = record.get('edge');
      if (node1.properties.id) {
        nodes.push({
          ...node1.properties,
        });
      }
      if (node2.properties.id) {
        nodes.push({
          ...node2.properties,
        });
      }
      if (edge.properties.source) {
        edges.push({
          ...edge.properties,
        });
      }
    });
  });
  return {
    nodes: uniqueArray(nodes, (n) => n.id),
    edges,
  };
}

export const retrieveNetworkByTaskIdAndLevel = async (taskId: string, level: number): Promise<Layer<Node>> => {
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

export const updateNodes = async (
  nodes: (Node | HeadCluster)[],
  updateCallback: (n: Node | HeadCluster) => {
    [key in keyof (Node | HeadCluster)]?: (Node | HeadCluster)[key]
  }
) => {
  await runTransaction(async (txc) => {
    nodes.forEach(async (node) => {
      const { id } = node;
      const setMap = updateCallback(node);
      await txc.run(
        `Match (node {id:$id}) Set node += $map`, {
        id,
        map: setMap,
      });
    });
  });
}