import { Request, Response } from 'express';
import * as network from 'src/type/network';
import networkData from 'src/mock/networkData.json';


export const retrieve = async (req: Request, res: Response, next: (error: Error) => any) => {
  try {
    res.json({
      message: 'success',
      data: networkData as network.LayerNetwork,
    })
  } catch (error) {
    next(error);
  }
}
