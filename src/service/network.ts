import { runTransaction } from 'src/db/neo4jDriver';
import { Node, Edge, Network, LayerNetwork, CrossLevelEdge, Cluster } from "src/type/network";
import { array2Map, uniqueArray } from 'src/util/array';
import { getJoinString, props2CypherParam } from 'src/util/string';

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
export const saveNetwork = async (
  net: Network,
  name: string,
) => {
  await saveNodes(net.nodes, name);
  await saveEdges(net.edges, name);
}
export const readNodesById = async (
  ids: string[],
  label: string,
  taskId?: string,
): Promise<Node[]> => {
  let query = `UNWIND $ids as id ` +
    `MATCH (node:${label}) ` +
    `WHERE (node.id=id AND node.taskId=$taskId) OR (node.id=id AND node.level=0) ` +
    `RETURN node `;
  const nodesRes: Node[] = [];
  await runTransaction(async (txc) => {
    // read node
    const res = await txc.run(query, { ids, taskId });
    res.records.forEach(record => {
      const node = record.get('node');
      nodesRes.push(node.properties);
    });
  });
  return nodesRes;
};
export const readNodesByProps = async (
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
    // read node
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
export const readEdgesByProps = async (
  label: string,
  props?: object,
  limit?: number,
): Promise<Edge[]> => {
  const propsString = props2CypherParam(props);
  let query = `MATCH ( n1: ${label} ${propsString})-[e]->( n2: ${label} ${propsString}) RETURN DISTINCT e `;
  if (limit != null) {
    query += `LIMIT ${limit}`;
  }
  const edgesRes: Edge[] = [];
  await runTransaction(async (txc) => {
    const edges = await txc.run(query, props);
    edges.records.forEach(record => {
      const e = record.get('e');
      edgesRes.push(e.properties);
    });
  });
  return edgesRes;
}
export const readCompleteLayer = async (
  label: string,
  props?: object,
): Promise<Network> => ({
  nodes: await readNodesByProps(label, props),
  edges: await readEdgesByProps(label, props),
});
export const readPartNetwork = async (
  label: string,
  level?: number,
  taskId?: string,
  limit?: number,
): Promise<Network> => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  await runTransaction(async (txc) => {
    let query: string;
    if (level && taskId != null) {
      query =
        `MATCH ( node1: ${label} { level: $level, taskId: $taskId })-[edge:${label}]->( node2: ${label} { level: $level, taskId: $taskId }) ` +
        `RETURN node1, node2, edge `;
    } else {
      query = `MATCH (node1:${label} { level: 0 })-[edge:${label}]->(node2:${label} { level: 0 }) RETURN node1, node2, edge `;
    }
    if (limit) {
      query += `LIMIT ${limit} `;
    }
    // read nodes and edges at one query
    const queryRes = await txc.run(query, { level, taskId });
    queryRes.records.forEach(record => {
      const node1 = record.get('node1');
      const node2 = record.get('node2');
      const edge = record.get('edge');
      if (node1.properties.id) {
        nodes.push(node1.properties);
      }
      if (node2.properties.id) {
        nodes.push(node2.properties);
      }
      if (edge.properties.source) {
        edges.push(edge.properties);
      }
    });
  });
  return {
    nodes: uniqueArray(nodes, (n) => n.id),
    edges,
  };
}
export const readDirectlyConnectedNodeNetworkMap = async (
  ids: string[],
  label: string,
  taskId?: string,
): Promise<Map<string, Network>> => {
  const map = new Map<string, Network>();
  await runTransaction(async (txc) => {
    const query = `UNWIND $ids as id ` +
      `MATCH (n1:${label})-[e:${label}]-(n2:${label}) ` +
      `WHERE n1.id=id AND (n1.level=0 OR n1.taskId=$taskId ) ` +
      `RETURN id, e, n2`;
    const res = await txc.run(query, { ids, taskId });
    res.records.forEach((record) => {
      const id = record.get('id');
      const edge = record.get('e');
      const node = record.get('n2');
      if (!map.has(id)) {
        map.set(id, { nodes: [], edges: [] });
      }
      const net = map.get(id);
      net.nodes.push(node.properties);
      net.edges.push(edge.properties);
    });
  });
  return map;
};
export const readConnectedNeighbourClusterNetworkMap = async (
  ids: string[],
  label: string,
  taskId: string,
): Promise<Map<string, { nodes: Cluster[], edges: CrossLevelEdge[] }>> => {
  const map = new Map<string, { nodes: Cluster[], edges: CrossLevelEdge[] }>();
  await runTransaction(async (txc) => {
    const query = `UNWIND $ids as id ` +
      `MATCH (n1:${label})-[e:${label}]-(n2:${label}) ` +
      `WHERE n1.id=id ` +
      `WITH n1, n2, e ` +
      `MATCH r=(n2)<-[:${label}_include *1..]-(c:${label}) ` +
      `WHERE c.taskId=$taskId ` +
      `RETURN DISTINCT n1.id as nid, e.source as s, e.target as t, c `;
    const res = await txc.run(query, { ids, taskId });
    res.records.forEach((record) => {
      const nid = record.get('nid');
      const source = record.get('s');
      const target = record.get('t');
      const cluster = record.get('c').properties;
      const { id: cid } = cluster;
      const clEdge: CrossLevelEdge = { nid, cid, source, target };
      if (!map.has(nid)) {
        map.set(nid, { nodes: [], edges: [] });
      }
      const net = map.get(nid);
      net.nodes.push(cluster);
      net.edges.push(clEdge);
    });
  });
  return map;
};
export const readNodeNumber = async (
  label: string,
  props?: object,
) => {
  const propsString = props2CypherParam(props);
  let query = `MATCH (node:${label} ${propsString}) RETURN COUNT(node) AS COUNT `;
  let num = 0;
  await runTransaction(async (txc) => {
    const res = await txc.run(query, props);
    const { low, high } = res.records[0].get('COUNT');
    num = low - high;
  });
  return num;
};
export const readEdgeNumber = async (
  label: string,
  props?: object,
) => {
  const propsString = props2CypherParam(props);
  let query = `MATCH ( n1: ${label} ${propsString})-[e]->( n2: ${label} ${propsString}) RETURN COUNT(e) AS COUNT `;
  let num = 0;
  await runTransaction(async (txc) => {
    const res = await txc.run(query, props);
    const { low, high } = res.records[0].get('COUNT');
    num = low - high;
  });
  return num;
};

export const createIndex = async (label: string, index: string) => {
  const indexName = getJoinString(label, index);
  await runTransaction(async (txc) => {
    await txc.run(`CREATE INDEX ${indexName} FOR (n:${label}) ON (n.${index})`);
  });
}
export const findCrossLevelEdges = (nets: LayerNetwork) => {
  let currentLevel = nets.length - 1;
  const edges: Edge[] = [];
  while (currentLevel > 0) {
    const currentNet = nets[currentLevel];
    const lowNet = nets[currentLevel - 1];
    const lowNetMap = array2Map(lowNet.nodes, (n) => n.id);
    currentNet.nodes.forEach((node) => {
      const { id, nodes } = node;
      if (Array.isArray(nodes)) {
        nodes.forEach((nodeId) => {
          if (lowNetMap.has(nodeId)) {
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