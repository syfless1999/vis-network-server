import { Request, Response } from 'express';
import * as network from 'src/type/network';
import networkData from 'src/mock/networkData.json';
import { retrieveNetworkByTaskIdAndLevel } from 'src/service/network';
import { string2ObjectId } from 'src/util/mongodb';
import Task from 'src/model/Task';
import { retrieveOneTask } from 'src/service/task';

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
    const { params: { taskId }, query: { queryLevel } } = req;
    const task = await retrieveOneTask(taskId);
    if (task == null) {
      throw new Error(`There is no task which's id is ${taskId}`);
    }
    if (task.get('progress') < 100) {
      throw new Error('This task has not been finished.');
    }
    let level = queryLevel != undefined ? queryLevel : task.largestLevel;
    const layer = await retrieveNetworkByTaskIdAndLevel(taskId, Number(level));
    res.json({
      message: 'success',
      data: [layer],
    })
  } catch (error) {
    next(error);
  }
}