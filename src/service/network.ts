import { runTransaction } from 'src/db/neo4jDriver';
import { Node, HeadCluster, Edge, Layer, LayerNetwork } from "src/type/network";
import { uniqueArray } from 'src/util/array';
import { nodes2Map } from 'src/util/network';

export const saveNodes = async (
  nodes: (Node | HeadCluster)[],
  label: string,
) => {
  await runTransaction(async (txc) => {
    await txc.run(`UNWIND $nodes AS node CREATE (n:${label}) SET n = node`, {
      nodes,
    });
  });
};
export const saveEdges = async (
  edges: Edge[],
  nodeLabel: string,
  edgeLabel?: string,
) => {
  if (!edgeLabel) {
    edgeLabel = nodeLabel;
  }
  await runTransaction(async (txc) => {
    await txc.run(
      `UNWIND $edges as edge ` +
      `MATCH (a:${nodeLabel}), (b:${nodeLabel}) ` +
      `WHERE a.id = edge.source AND b.id = edge.target ` +
      `CREATE (a)-[e:${edgeLabel}]->(b) SET e = edge `, {
      edges,
    })
  });
};
export const saveLayer = async (
  layer: Layer<Node | HeadCluster>,
  name: string,
) => {
  await saveNodes(layer.nodes, name);
  await saveEdges(layer.edges, name);
}

export const createIndex = async (label: string, index: string) => {
  const indexName = `${label}_${index}`;
  await runTransaction(async (txc) => {
    await txc.run(`CREATE INDEX ${indexName} FOR (n:${label}) ON (n.${index})`);
  });
}

export const dropIndex = async (label: string, index: string) => {
  const indexName = `${label}_${index}`;
  await runTransaction(async (txc) => {
    await txc.run(`DROP INDEX ${indexName}`);
  });
}

export const retrieveNodes = async (
  label: string,
  level: number = 0,
  limit?: number,
): Promise<(Node | HeadCluster)[]> => {
  const nodesRes: (Node | HeadCluster)[] = [];
  await runTransaction(async (txc) => {
    // retrieve node
    const nodes = await txc.run(
      `MATCH (node:${label} {level:$level}) RETURN node`, {
      level,
    });
    nodes.records.forEach(record => {
      const node = record.get('node');
      nodesRes.push({
        ...node.properties,
      });
    });
  });
  return nodesRes;
};
export const retrieveEdges = async (
  label: string,
  level: number = 0,
): Promise<Edge[]> => {
  const edgesRes: Edge[] = [];
  await runTransaction(async (txc) => {
    const edges = await txc.run(
      `MATCH (n1:${label} {level:$level})-[edge]->(n2:${label} {level:$level}) RETURN DISTINCT edge`, {
      level,
    });
    edges.records.forEach(record => {
      const edge = record.get('edge');
      edgesRes.push(edge.properties);
    });
  });
  return edgesRes;
}

export const retrieveCompleteSourceNetwork = async (label: string): Promise<Layer<Node>> => {
  const nodes = await retrieveNodes(label) as Node[];
  const edges = await retrieveEdges(label);
  return {
    nodes,
    edges,
  };
}

export const retrievePartSourceNetwork = async (label: string, limit: number = 100): Promise<Layer<Node>> => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  await runTransaction(async (txc) => {
    // retrieve nodes and edges at one query
    const queryRes = await txc.run(
      `MATCH (node1:${label} {level:$level})-[edge]->(node2:${label} {level:$level}) RETURN node1, node2, edge LIMIT ${limit}`, {
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

export const retrieveNetworkByTaskIdAndLevel = async (label: string, taskId: string, level: number): Promise<Layer<Node>> => {
  const result: Layer<Node> = {
    nodes: [],
    edges: [],
  };
  await runTransaction(async (txc) => {
    // retrieve node
    const nodes = await txc.run(`MATCH (node:${label} {level:${level}, taskId:'${taskId}'}) RETURN node`);
    nodes.records.forEach(record => {
      const node = record.get('node');
      result.nodes.push({
        ...node.properties,
      });
    });
    // retrieve edge
    const edges = await txc.run(
      `MATCH (n1:${label} {level:${level}, taskId:'${taskId}'})-[edge]->(n2:${label} {level:${level}, taskId:'${taskId}'}) RETURN DISTINCT edge`
    );
    edges.records.forEach(record => {
      const edge = record.get('edge');
      result.edges.push(edge.properties);
    });
  });
  return result;
};

export const findCrossLayerEdges = (layers: LayerNetwork) => {
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