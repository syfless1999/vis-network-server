import { Request, Response } from 'express';
import DataSource from 'src/model/DataSource';

/**
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
    progress: 0,
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
 * check what datasource is not completed, and update the data of it
 */
export const updateDataSourceList = () => {
  // const d = new Date();
  // console.log('At One Minutes:', d);
};