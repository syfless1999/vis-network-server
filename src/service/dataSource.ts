import request from 'superagent';
import DataSource from 'src/model/DataSource';
import config from 'src/config';
import { saveEdges, saveNodes } from 'src/service/Network';
import { Node } from 'src/type/network'

export const retrieveDataSourceList = async () => {
  const list = await DataSource
    .where('url').exists(true)
    .where('name').exists(true)
    .exec();
  return list;
}

export const retrieveDataSource = async (dataSourceId: string) => {
  const ds = await DataSource.findById(dataSourceId).exec();
  return ds;
}

export const updateNodeDataSource = async (dsView: any) => {
  const { node, name, _id } = dsView;
  const { body } = await request.get(dsView.url).query({
    nodeStart: node.current + 1,
    nodeEnd: node.current + config.datasource_fetch_length,
  });
  const { data, total: nodeTotal, end: realEnd } = body.node;
  const { total: edgeTotal } = body.edge;

  await saveNodes(data.map((node: Node) => ({
    ...node,
    level: 0,
    features: [] as string[],
  })), name);
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
    edgeEnd: edge.current + config.datasource_fetch_length,
  });
  const { data, total, end: realEnd } = body.edge;
  await saveEdges(data, name);
  await DataSource.findByIdAndUpdate(_id, {
    $set: {
      'edge.total': total,
      'edge.current': realEnd,
    }
  });
}
