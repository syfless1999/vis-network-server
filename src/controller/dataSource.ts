import { Request, Response } from 'express';
import mongoose from 'mongoose';
import request from 'superagent';
import async from 'async';
import DataSource from 'src/model/DataSource';
import config from 'src/config';
import { getSession } from 'src/db/neo4jDriver';

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

const updateNodeDataSource = async (dsView: any) => {
  const { node, _id, name } = dsView;

  async.auto({
    get_data: async function (cb) {
      const { current } = node;
      const end = current + config.update_datasource_interval;
      try {
        const { body } = await request.get(dsView.url).query({
          nodeStart: current,
          nodeEnd: end,
        });
        cb(null, body.node);
      } catch (error) {
        cb(error);
      }
    },
    append_nodes: ['get_data', async function (results, cb) {
      const { get_data: nodeData } = results;
      const { data } = nodeData;

      const session = getSession();
      const txc = session.beginTransaction();
      try {
        const nodeCreateTasks = data.map((node: any) => txc.run(`CREATE (n:${name} $node)`, { node }));
        await Promise.all(nodeCreateTasks);
        await txc.commit();
        cb(null, null);
      } catch (error) {
        cb(error);
        await txc.rollback();
      } finally {
        session.close();
      }
    }],
    update_total: ['append_nodes', async function (results, cb) {
      try {
        const { get_data: nodeData } = results;
        console.log(nodeData)
        const { total, end: realEnd } = nodeData;
        await DataSource.findByIdAndUpdate(_id, {
          $set: {
            'node.total': total,
            'node.current': Number(realEnd) + 1,
          }
        });
      } catch (error) {
        cb(error)
      }
    }],
  }, (err, res) => {
    err && console.log(`err${err}`);
    res && console.log(res);
  });
}

const updateEdgeDataSource = async (dsView: any) => {
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
    .where('url').exists(true)
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
    await updateNodeDataSource(ds);
    return await updateEdgeDataSource(ds);
  });
  edgeUpdateList.map(async (ds) => {
    return await updateEdgeDataSource(ds);
  });

  // const res = await request.get(list[0].url).query({ nodeStart: 7, nodeEnd: 10 });
  // console.log(res);
  // todo: 
  // 1. fetch node/edge based on url
  // 2. node/edge save to neo4j
  // 3. loop to 1.
};