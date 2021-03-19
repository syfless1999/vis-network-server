import { runTransaction } from 'src/db/neo4jDriver';
import { Node, Edge, Layer, LayerNetwork } from "src/type/network";
import { uniqueArray } from 'src/util/array';
import { nodes2Map } from 'src/util/network';
import { getJoinString } from 'src/util/string';

// save
export const saveNodes = async (
  nodes: Node[],
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
  layer: Layer,
  name: string,
) => {
  await saveNodes(layer.nodes, name);
  await saveEdges(layer.edges, name);
}

// retrieve
export const retrieveNodes = async (
  label: string,
  level: number = 0,
  taskId?: string,
  limit?: number,
): Promise<Node[]> => {
  let query: string;
  if (taskId != null) {
    query = `MATCH ( node: ${label} { level: ${level}, taskId: '${taskId}' }) RETURN node `;
  } else {
    query = `MATCH ( node: ${label} { level: ${level} }) RETURN node `;
  }
  if (limit != null) {
    query += `LIMIT ${limit} `;
  }
  const nodesRes: Node[] = [];
  await runTransaction(async (txc) => {
    // retrieve node
    const nodes = await txc.run(query);
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
  taskId?: string,
  limit?: number,
): Promise<Edge[]> => {
  let query: string;
  if (taskId != null) {
    query = `MATCH ( n1: ${label} { level: ${level}, taskId: '${taskId}' })-[edge]->( n2: ${label} { level: ${level}, taskId: '${taskId}'  }) RETURN DISTINCT edge `;
  } else {
    query = `MATCH ( n1: ${label} { level: ${level} })-[edge]->( n2: ${label} { level: ${level} }) RETURN DISTINCT edge `;
  }
  if (limit != null) {
    query += `LIMIT ${limit}`;
  }
  const edgesRes: Edge[] = [];
  await runTransaction(async (txc) => {
    const edges = await txc.run(
      query, {
      level,
    });
    edges.records.forEach(record => {
      const edge = record.get('edge');
      edgesRes.push(edge.properties);
    });
  });
  return edgesRes;
}
export const retrieveCompleteLayer = async (
  label: string,
  level?: number,
  taskId?: string,
): Promise<Layer> => {
  const nodes = await retrieveNodes(label, level, taskId);
  const edges = await retrieveEdges(label, level, taskId);
  return {
    nodes,
    edges,
  };
}
export const retrievePartNetwork = async (
  label: string,
  level?: number,
  taskId?: string,
  limit: number = 100,
): Promise<Layer> => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  await runTransaction(async (txc) => {
    let query: string;
    if (level && taskId != null) {
      query =
        `MATCH ( node1: ${label} { level: ${level}, taskId: '${taskId}' })-[edge:${label}]->( node2: ${label} { level: ${level}, taskId: '${taskId}' }) ` +
        `RETURN node1, node2, edge LIMIT ${limit} `;
    } else {
      query = `MATCH (node1:${label} {level:0})-[edge:${label}]->(node2:${label} {level:0}) RETURN node1, node2, edge LIMIT ${limit}`;
    }
    // retrieve nodes and edges at one query
    const queryRes = await txc.run(query);
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

// index
export const createIndex = async (label: string, index: string) => {
  const indexName = getJoinString(label, index);
  await runTransaction(async (txc) => {
    await txc.run(`CREATE INDEX ${indexName} FOR (n:${label}) ON (n.${index})`);
  });
}

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