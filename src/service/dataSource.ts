import request from 'superagent';
import DataSource, { DataSourceDocument } from 'src/model/DataSource';
import config from 'src/config';
import { createIndex, saveEdges, saveNodes } from 'src/service/Network';
import { Node } from 'src/type/network'
import { objectId2String } from 'src/util/string';
import { cronDebug } from 'src/util/debug';
import { measureTimeWrapper } from 'src/util/performance';

export const readDataSourceList = async () => {
  const list = await DataSource
    .where('url').exists(true)
    .where('name').exists(true)
    .exec();
  return list;
}
export const readDataSource = async (dataSourceId: string) => {
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
  cronDebug(`Fetch Task Start [${objectId2String(_id)}]: node current ${node.current}`);
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
  if (realEnd + 1 === nodeTotal) {
    await createIndex(name, 'id');
  }
  cronDebug(`Fetch Task End [${objectId2String(_id)}]: node fetch ${node.current} -- ${realEnd}`);
};
const fetchEdges = async (dsView: DataSourceDocument) => {
  const { edge, name, _id } = dsView;
  cronDebug(`Fetch Task Start [${objectId2String(_id)}]: edge current ${edge.current}`);
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
  cronDebug(`Fetch Task End [${objectId2String(_id)}]: edge fetch ${edge.current} -- ${realEnd}`);
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
};
export const fetchNodeDataSource = measureTimeWrapper(fetchDataSourceWrapper(fetchNodes), 'fetch node');
export const fetchEdgeDataSource = measureTimeWrapper(fetchDataSourceWrapper(fetchEdges), 'fetch edge');
