import { Request, Response } from 'express';
import * as network from 'src/type/network';
import networkData from 'src/mock/networkData.json';
import { retrieveNetworkByTaskIdAndLevel, retrievePartSourceNetwork } from 'src/service/network';
import { retrieveOneTask } from 'src/service/task';
import { Layer, Node, HeadCluster } from 'src/type/network';

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
    const { params: { taskId }, query: { level: queryLevel } } = req;
    const task = await retrieveOneTask(taskId);
    if (task == null) {
      throw new Error(`There is no task which's id is ${taskId}`);
    }
    if (task.progress < 100) {
      throw new Error('This task has not been finished.');
    }
    const level = queryLevel == undefined || Number(queryLevel) < 0 ? task.largestLevel : Number(queryLevel);
    let layer: Layer<Node | network.HeadCluster>;
    if (level == 0) {
      layer = await retrievePartSourceNetwork(task.dataSource[0].name, 50);
    } else {
      layer = await retrieveNetworkByTaskIdAndLevel(taskId, Number(level));
    }
    const layerNetwork = Array.from({ length: task.largestLevel + 1 });
    layerNetwork[level] = layer;
    res.json({
      message: 'success',
      data: layerNetwork,
    })
  } catch (error) {
    next(error);
  }
}

export const expandNode = async (req: Request, res: Response, next: (error: Error) => any) => {
  try {
    const { body: { displayNetwork, targetId } } = req;
    console.log('====================================');
    console.log(displayNetwork.nodes.length);
    console.log(targetId);
    console.log('====================================');
    // TODO
  } catch (error) {
    next(error);
  }
}


export const shrinkNode = async (req: Request, res: Response, next: (error: Error) => any) => {
  try {
    const { body: { displayNetwork, targetId } } = req;
    console.log('====================================');
    console.log(displayNetwork.nodes.length);
    console.log(targetId);
    console.log('====================================');
    // TODO
  } catch (error) {
    next(error);
  }
}
