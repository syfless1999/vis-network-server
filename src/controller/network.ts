import { Request, Response } from 'express';
import * as network from 'src/type/network';
import networkData from 'src/mock/networkData.json';
import { retrieveNetworkAndEdgeByLevelAndLabel } from 'src/service/network';

/**
 * http [ temporary ]
 * @param req 
 * @param res 
 * @param next 
 */
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

/**
 * http
 * @param req 
 * @param res 
 * @param next 
 */
export const retrieveLayer = async (req: Request, res: Response, next: (error: Error) => any) => {
  try {
    const { params: { datasourceName }, query: { level } } = req;
    const layer = retrieveNetworkAndEdgeByLevelAndLabel(datasourceName, Number(level));
    res.json({
      message: 'success',
      data: [layer],
    })
  } catch (error) {
    next(error);
  }
}