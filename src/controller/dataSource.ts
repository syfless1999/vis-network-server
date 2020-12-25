import { Request, Response } from 'express';
import DataSource from 'src/model/DataSource';

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

// export const getList = (req: Request, res: Response) => {
//   User.find((err, users) => {
//     if (err) {
//       res.status(500).json({ message: 'fail' });
//     }
//     res.json({
//       message: 'success',
//       users,
//     });
//   })
// }