import { Request, Response } from 'express';
import networkData from 'src/mock/networkData.json';

export const retrieve = async (req: Request, res: Response, next: (error: Error) => any) => {
  try {
    res.json({
      message: 'success',
      data: networkData,
    })
  } catch (error) {
    next(error);
  }
}
