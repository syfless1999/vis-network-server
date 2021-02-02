import { Request, Response } from 'express';
import { Socket } from 'socket.io';
import { dsIO } from 'src/websocket';
import DataSource from 'src/model/DataSource';
import { retrieveDataSourceList, updateEdgeDataSource, updateNodeDataSource } from 'src/service/datasource';
import { nextTick } from 'process';

/**
 * <http>
 * create one datasource
 */
export const create = async (req: Request, res: Response, next: (err: Error) => void) => {
  try {
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
    await newDataSource.save();
    res.json({ message: 'success' });
  } catch (error) {
    next(error);
  }
}

/**
 * <http>
 * retrieve list of datasource
 */
export const retrieve = async (req: Request, res: Response, next: (err: Error) => void) => {
  try {
    let dataSourceList = await retrieveDataSourceList();
    res.json({
      message: 'success',
      data: dataSourceList,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * <websocket>
 * datasource socket(list or single)
 */
export const dataSourceSocketHandler = async (socket: Socket) => {
  let dataSourceList = await retrieveDataSourceList();
  socket.join('datasource_list_room');
  socket.emit('list', {
    message: 'success',
    list: dataSourceList,
  });
}

/**
 * <cron>
 * check what datasource is not completed, and update the data of it
 * TODO:
 *  1. when interval is not enough to update the whole DataSources' nodes and edges, how to solve it?
 *  2. what strategy is comfortable for update several ds of different scale?
 */
export const updateDataSourceCron = async () => {
  try {
    const list = await retrieveDataSourceList();
    const nodeUpdateList = list.filter(ds =>
      ds.node.total == 0 ||
      ds.node.total > ds.node.current
    );
    const edgeUpdateList = list.filter(ds =>
      ds.node.total != 0 &&
      ds.node.total <= ds.node.current && (
        ds.edge.total == 0 ||
        ds.edge.total > ds.edge.current
      )
    );
    const needUpdate = nodeUpdateList.length || edgeUpdateList.length;
    if (needUpdate) {
      const nodeUpdateTasks = nodeUpdateList.map((ds) => updateNodeDataSource(ds));
      const edgeUpdateTasks = edgeUpdateList.map((ds) => updateEdgeDataSource(ds));
      await Promise.all([...nodeUpdateTasks, ...edgeUpdateTasks]);
      const newDataSourceList = await retrieveDataSourceList();
      dsIO.to('datasource_list_room').emit('list', {
        message: 'success',
        list: newDataSourceList,
      });
    }
  } catch (error) {
    console.error(error)
  }
};