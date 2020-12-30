import request from 'superagent';
import DataSource from 'src/model/DataSource';
import config from 'src/config';
import { runTransaction } from 'src/db/neo4jDriver';

export const retrieveDataSourceList = async () => {
  const list = await DataSource
    .where('url').exists(true)
    .where('name').exists(true)
    .exec();
  return list;
}

export const updateNodeDataSource = async (dsView: any) => {
  const { node, name, _id } = dsView;
  const { body } = await request.get(dsView.url).query({
    nodeStart: node.current + 1,
    nodeEnd: node.current + config.update_datasource_interval,
  });
  const { data, total: nodeTotal, end: realEnd } = body.node;
  const { total: edgeTotal } = body.edge;

  await runTransaction(async (txc) => {
    const nodeCreateTasks = data.map((node: any) => txc.run(`CREATE (n:${name} $node)`, { node }));
    await Promise.all(nodeCreateTasks);
  });
  await DataSource.findByIdAndUpdate(_id, {
    $set: {
      'node.total': nodeTotal,
      'edge.total': edgeTotal,
      'node.current': realEnd,
    }
  });
};

export const updateEdgeDataSource = async (dsView: any) => {
  const { edge, name, _id } = dsView;
  const { body } = await request.get(dsView.url).query({
    edgeStart: edge.current + 1,
    edgeEnd: edge.current + config.update_datasource_interval,
  });
  const { data, total, end: realEnd } = body.edge;

  await runTransaction(async (txc) => {
    const edgeCreateTasks = data.map(
      (edge: any) => {
        const { target, source, type, ...params } = edge;
        return txc.run(
          `Match (s1:${name} {id:$target}),(s2:${name} {id:$source}) Create (s1)-[r:${type} $params]->(s2)`, {
          target: target,
          source: source,
          type: type,
          params,
        });
      });
    await Promise.all(edgeCreateTasks);
  });
  await DataSource.findByIdAndUpdate(_id, {
    $set: {
      'edge.total': total,
      'edge.current': realEnd,
    }
  });
}
