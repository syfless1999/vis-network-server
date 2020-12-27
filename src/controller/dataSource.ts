import { Request, Response } from 'express';
import mongoose from 'mongoose';
import request from 'superagent';
import async from 'async';
import DataSource from 'src/model/DataSource';
import config from 'src/config';

/**
 * <http>
 * create one datasource
 */
export const create = (req: Request, res: Response) => {
  const { body } = req;
  const newDataSource = new DataSource({
    name: body.name,
    url: body.url,
    node: {
      total: 0,
      current: 0,
      param: body.nodeParam.split(','),
    },
    edge: {
      total: 0,
      current: 0,
      param: body.edgeParam.split(','),
    },
    scale: body.scale,
    needExpand: body.needExpand,
    expandSource: body.expandSource,
  });
  newDataSource.save((err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'fail' });
    }
    res.json({
      message: 'success',
    });
  });
}

/**
 * <websocket>
 * get the list of datasource
 */
export const getList = (req: Request, res: Response) => {
  DataSource.find((err, dataSources) => {
    if (err) {
      res.status(500).json({ message: 'fail' });
    }
    res.json({
      message: 'success',
      dataSources,
    });
  })
}



interface DataSourceView {
  _id: string;
  name: string;
  url: string;
  node: {
    total: number;
    current: number;
  };
  edge: {
    total: number;
    current: number;
  }
}
const updateNodeDataSource = async (dsView: DataSourceView) => {
  const { node, _id } = dsView;
  const { total: nowTotal, current } = node;
  console.log('dsView node')
  console.log(dsView.node)
  const nowEnd = current + config.update_datasource_interval;

  async.auto({
    get_data: async function (cb) {
      try {
        const { body } = await request.get(dsView.url).query({
          nodeStart: current,
          nodeEnd: nowEnd,
        });
        console.log('body');
        console.log(body.total, body.end);
        cb(null, body);
      } catch (error) {
        cb(error);
      }
    },
    update_total: ['get_data', function (results, cb) {
      const { get_data: data } = results;
      const { total, end } = data;
      DataSource.findByIdAndUpdate(_id, {
        $set: {
          'node.total': total,
          'node.current': end,
        }
      }, null, (err, res) => {
        if (err) return err;
        console.log(res);
      });
    }],
    append_nodes: ['get_data', function (results, cb) {
      // console.log('append_nodes');
    }],
  }, (err, res) => {
    err && console.log(`err${err}`);
    res && console.log(res);
  });
}
const updateEdgeDataSource = async (dsView: DataSourceView) => {
  // TODO
  return await 'good';
}

/**
 * <cron>
 * check what datasource is not completed, and update the data of it
 * TODO:
 *  1. when interval is not enough to update the whole DataSources' nodes and edges, how to solve it?
 *  2. what strategy is comfortable for update several ds of different scale?
 */
export const updateDataSourceCron = async () => {
  const d = new Date();
  const list = await DataSource
    .where('url')
    .select('_id name url node.total node.current edge.total edge.current')
    .exec();

  const nodeUpdateList = list.filter(ds =>
    ds.node.total == 0 ||
    ds.node.total > ds.node.current
  );
  const edgeUpdateList = list.filter(ds =>
    ds.node.total != 0 &&
    ds.node.total == ds.node.current &&
    ds.edge.total > ds.edge.current
  );

  nodeUpdateList.map(async (ds) => {
    await updateNodeDataSource(ds as DataSourceView);
    return await updateEdgeDataSource(ds as DataSourceView);
  });
  edgeUpdateList.map(async (ds) => {
    return await updateEdgeDataSource(ds as DataSourceView);
  });

  // const res = await request.get(list[0].url).query({ nodeStart: 7, nodeEnd: 10 });
  // console.log(res);
  // todo: 
  // 1. fetch node/edge based on url
  // 2. node/edge save to neo4j
  // 3. loop to 1.
};