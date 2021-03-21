import { runTransaction } from 'src/db/neo4jDriver';
import { Node, Edge, Network, LayerNetwork, CrossLevelEdge } from "src/type/network";
import { array2Map, uniqueArray } from 'src/util/array';
import { getJoinString, props2CypherParam } from 'src/util/string';

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
  layer: Network,
  name: string,
) => {
  await saveNodes(layer.nodes, name);
  await saveEdges(layer.edges, name);
}

// retrieve
export const retrieveNodesById = async (
  label: string,
  taskId: string,
  ids: string[],
  limit?: number,
): Promise<Node[]> => {
  let query = `UNWIND $ids as id ` +
    `MATCH (node:${label}) ` +
    `WHERE (node.id=id AND node.taskId=$taskId) OR (node.id=id AND node.level=0) ` +
    `RETURN node `;
  const nodesRes: Node[] = [];
  await runTransaction(async (txc) => {
    // retrieve node
    const res = await txc.run(query, { ids, taskId });
    res.records.forEach(record => {
      const node = record.get('node');
      nodesRes.push({
        ...node.properties,
      });
    });
  });
  return nodesRes;
};
export const retrieveNodesByProps = async (
  label: string,
  props?: object,
  limit?: number,
): Promise<Node[]> => {
  const propsString = props2CypherParam(props);
  let query = `MATCH (node:${label} ${propsString}) RETURN node `;
  if (limit != null) {
    query += `LIMIT ${limit}`;
  }
  const nodesRes: Node[] = [];
  await runTransaction(async (txc) => {
    // retrieve node
    const nodes = await txc.run(query, props);
    nodes.records.forEach(record => {
      const node = record.get('node');
      nodesRes.push({
        ...node.properties,
      });
    });
  });
  return nodesRes;
};
export const retrieveEdgesByProps = async (
  label: string,
  props?: object,
  limit?: number,
): Promise<Edge[]> => {
  const propsString = props2CypherParam(props);
  let query = `MATCH ( n1: ${label} ${propsString})-[edge]->( n2: ${label} ${propsString}) RETURN DISTINCT edge `;
  if (limit != null) {
    query += `LIMIT ${limit}`;
  }
  const edgesRes: Edge[] = [];
  await runTransaction(async (txc) => {
    const edges = await txc.run(query, props);
    edges.records.forEach(record => {
      const edge = record.get('edge');
      edgesRes.push(edge.properties);
    });
  });
  return edgesRes;
}
export const retrieveCompleteLayer = async (
  label: string,
  props?: object,
): Promise<Network> => {
  // 
  const nodes = await retrieveNodesByProps(label, props, 100);
  const edges = await retrieveEdgesByProps(label, props, 100);
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
): Promise<Network> => {
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

export const retrieveDirectlyConnectedEdgeMap = async (
  ids: string[],
  label: string,
  taskId?: string,
): Promise<Map<string, Edge[]>> => {
  const map = new Map<string, Edge[]>();
  await runTransaction(async (txc) => {
    const query = `UNWIND $ids as id ` +
      `MATCH (n1:${label})-[e:${label}]-(:${label}) ` +
      `WHERE n1.id=id AND (n1.level=0 OR n1.taskId=$taskId ) ` +
      `RETURN id, e.source as source, e.target as target`;
    const res = await txc.run(query, { ids, taskId });
    res.records.forEach((record) => {
      const id = record.get('id');
      const source = record.get('source');
      const target = record.get('target');
      const e = { source, target };
      if (!map.has(id)) {
        map.set(id, []);
      }
      const es = map.get(id);
      es.push(e);
    });
  })
  return map;
};

export const retrieveDirectlyConnectedNeighbourClusterEdgeMap = async (
  ids: string[],
  label: string,
  taskId: string,
): Promise<Map<string, CrossLevelEdge[]>> => {
  const map = new Map<string, CrossLevelEdge[]>();
  await runTransaction(async (txc) => {
    const query = `UNWIND $ids as id ` +
      `MATCH (n1:${label})-[e:${label}]-(n2:${label}) ` +
      `WHERE n1.id=id ` +
      `WITH n1, n2, e ` +
      `MATCH r=(n2)<-[:${label}_include *1..]-(c:${label}) ` +
      `WHERE c.taskId=$taskId ` +
      `RETURN DISTINCT n1.id as nid, e.source as source, e.target as target, c.id as cid `;
    const res = await txc.run(query, { ids, taskId });
    res.records.forEach((record) => {
      const nid = record.get('nid');
      const cid = record.get('cid');
      const source = record.get('source');
      const target = record.get('target');
      const clEdge: CrossLevelEdge = {
        nid,
        cid,
        source,
        target,
      };
      if (!map.has(nid)) {
        map.set(nid, []);
      }
      const clEdges = map.get(nid);
      clEdges.push(clEdge);
    });
  });
  return map;
};
// index
export const createIndex = async (label: string, index: string) => {
  const indexName = getJoinString(label, index);
  await runTransaction(async (txc) => {
    await txc.run(`CREATE INDEX ${indexName} FOR (n:${label}) ON (n.${index})`);
  });
}

export const findCrossLevelEdges = (layers: LayerNetwork) => {
  let currentLevel = layers.length - 1;
  const edges: Edge[] = [];
  while (currentLevel > 0) {
    const currentLayer = layers[currentLevel];
    const lowLayer = layers[currentLevel - 1];
    const lowLayerMap = array2Map(lowLayer.nodes, (n) => n.id);
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