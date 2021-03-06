import { Socket } from 'socket.io';
import { dsIO } from 'src/websocket';
import DataSource from 'src/model/DataSource';
import { readDataSourceList, fetchNodeDataSource, fetchEdgeDataSource, needFetchNodes, needFetchEdges, isFetching } from 'src/service/datasource';
import { Controller } from 'src/type/http';

/**
 * <http>
 * create one datasource
 */
export const create: Controller = async (req, res, next) => {
  try {
    const { body } = req;
    const newDataSource = new DataSource({
      name: body.name,
      isFetching: false,
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
 * read list of datasource
 */
export const read: Controller = async (req, res, next) => {
  try {
    let dataSourceList = await readDataSourceList();
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
  let dataSourceList = await readDataSourceList();
  socket.join('datasource_list_room');
  socket.emit('list', {
    message: 'success',
    list: dataSourceList,
  });
}

/**
 * <cron>
 */
export const fetchDataSourceCron = async () => {
  try {
    const list = await readDataSourceList();

    const nodeFetchList = list.filter(ds => !isFetching(ds) && needFetchNodes(ds));
    const edgeFetchList = list.filter(ds => !isFetching(ds) && needFetchEdges(ds));

    const needFetch = nodeFetchList.length || edgeFetchList.length;
    if (needFetch) {
      const nodeFetchTasks = nodeFetchList.map((ds) => fetchNodeDataSource(ds));
      await Promise.all(nodeFetchTasks);
      const edgeFetchTasks = edgeFetchList.map((ds) => fetchEdgeDataSource(ds));
      await Promise.all(edgeFetchTasks);
      const newDataSourceList = await readDataSourceList();
      dsIO.to('datasource_list_room').emit('list', {
        message: 'success',
        list: newDataSourceList,
      });
    }
  } catch (error) {
    console.error(error)
  }
};