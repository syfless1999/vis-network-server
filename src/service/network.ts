import { Record } from 'neo4j-driver';
import { runTransaction } from 'src/db/neo4jDriver';
import { Node, HeadCluster, Layer } from 'src/type/network';

export const retrieveNetworkAndEdgeByLevelAndLabel = async (label: string, level: number): Promise<Layer<Node>> => {
  const result: Layer<Node> = {
    nodes: [],
    edges: [],
  };
  await runTransaction(async (txc) => {
    // retrieve node
    const nodes = await txc.run(
      `Match (node:${label} {level:$level}) Return node`, { level }
    );
    nodes.records.forEach(record => {
      const node = record.get('node');
      result.nodes.push({
        ...node.properties,
      });
    });
    // retrieve edge
    const edges = await txc.run(
      `Match (n1:${label} {level:$level})-[edge]->(n2:${label} {level:$level}) Return Distinct edge`, { level }
    );
    edges.records.forEach(record => {
      const edge = record.get('edge');
      result.edges.push(edge.properties);
    });
  });
  return result;
};
