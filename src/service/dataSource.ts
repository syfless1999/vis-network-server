import request from 'superagent';
import DataSource, { DataSourceDocument } from 'src/model/DataSource';
import config from 'src/config';
import { saveEdges, saveNodes } from 'src/service/Network';
import { Node } from 'src/type/network'
import { objectId2String } from 'src/util/mongodb';
import { cronDebug } from 'src/util/debug';

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

export const isFetching = (
  source: {
    isFetching: boolean;
    [key: string]: any;
  }
) => source.isFetching;
/**
 * node fetch condition
 * 1. no node ==> total == 0
 * 2. not enough ==> total > current
 */
export const needFetchNodes = (ds: DataSourceDocument) => ds.node.total === 0 || ds.node.total > ds.node.current;
/**
 * edge fetch condition
 * 1. node fetch has finished ==> total != 0 && total <= current
 * 2. edge not finished ==> total == 0 || total > current
 */
export const needFetchEdges = (ds: DataSourceDocument) => !needFetchNodes(ds) && (
  ds.edge.total == 0 ||
  ds.edge.total > ds.edge.current
);

const fetchNodes = async (dsView: DataSourceDocument) => {
  const { node, name, _id } = dsView;
  const { body } = await request.get(dsView.url).query({
    nodeStart: node.current,
    nodeEnd: node.current + config.node_fetch_length,
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
      'node.current': realEnd + 1,
    }
  });
  cronDebug(`Fetch Task [${objectId2String(_id)}]: node fetch ${node.current} -- ${realEnd}`);
};
const fetchEdges = async (dsView: DataSourceDocument) => {
  const { edge, name, _id } = dsView;
  const { body } = await request.get(dsView.url).query({
    edgeStart: edge.current,
    edgeEnd: edge.current + config.edge_fetch_length,
  });
  const { data, total, end: realEnd } = body.edge;

  await saveEdges(data, name);
  await DataSource.findByIdAndUpdate(_id, {
    $set: {
      'edge.total': total,
      'edge.current': realEnd + 1,
    }
  });
  cronDebug(`Fetch Task [${objectId2String(_id)}]: edge fetch ${edge.current} -- ${realEnd}`);
}

const fetchDataSourceWrapper = (
  fetchFunc: (dsView: DataSourceDocument) => void,
) => {
  return async function (dsView: DataSourceDocument) {
    const { _id, isFetching } = dsView;
    if (isFetching) {
      return;
    }
    await DataSource.findByIdAndUpdate(_id, { $set: { 'isFetching': true } });
    await fetchFunc(dsView);
    await DataSource.findByIdAndUpdate(_id, { $set: { 'isFetching': false } });
  };
}
export const fetchNodeDataSource = fetchDataSourceWrapper(fetchNodes);
export const fetchEdgeDataSource = fetchDataSourceWrapper(fetchEdges);
