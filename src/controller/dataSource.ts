import { Request, Response } from 'express';
import DataSource from 'src/model/DataSource';

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
      param: body.nodeParam.split(','),
    },
    edge: {
      param: body.edgeParam.split(','),
    },
    progress: 12,
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

/**
 * <cron>
 * check what datasource is not completed, and update the data of it
 */
export const updateDataSourceList = () => {
  const d = new Date();
  const dataSourceTask: any = [];
  DataSource
    .where('progress').lt(100)
    .select('name url progress')
    .exec((err, res) => {
      if (err) {
        console.error(err.message);
      }
      dataSourceTask.concat(res);
    });

  // todo: 
  // 1. fetch node/edge based on url
  // 2. node/edge save to neo4j
  // 3. loop to 1.
};