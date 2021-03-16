import { Request, Response } from 'express';
import Task, { TaskClusterType } from 'src/model/Task';
import { isFetching, needFetchEdges, needFetchNodes, retrieveDataSource } from 'src/service/datasource';
import { retrieveTaskWithDataSourceList, handleTask, updateTask } from 'src/service/task';
// import HCluster from 'src/util/clusterMethod';

export const retrieve = async (req: Request, res: Response, next: (error: Error) => any) => {
  try {
    const list = await retrieveTaskWithDataSourceList();
    res.json({
      message: 'success',
      data: list,
    });
  } catch (error) {
    next(error);
  }
}

export interface CreateTaskParams {
  dataSourceId: string;
  clusterType: TaskClusterType;
  paramWeight?: Array<Array<string | number>>;
  topologyWeight?: number;
  needCustomizeSimilarityApi: boolean;
  similarityApi?: string;
  updateCycle: number;
}
const checkReqBody = async (reqBody: CreateTaskParams) => {
  const { dataSourceId, clusterType, paramWeight, topologyWeight } = reqBody;
  const ds = await retrieveDataSource(dataSourceId);
  if (!ds) {
    return false;
  }
  switch (clusterType) {
    case TaskClusterType.PARAM_ONLY:
      if (!checkParamWeight(paramWeight)) {
        return false;
      }
      break;
    case TaskClusterType.PARAM_AND_TOPOLOGY:
      if (!checkParamWeight(paramWeight)) {
        return false;
      }
      if (topologyWeight < 0 && topologyWeight > 1) {
        return false;
      }
    default:
      break;
  }
  return true;
}
const checkParamWeight = (paramWeight: Array<Array<string | number>>) => {
  let sum = 0;
  for (let i = 0; i < paramWeight.length; i++) {
    const weight = Number(paramWeight[i][1]);
    if (weight < 0 && weight > 1) {
      return false;
    }
    sum += weight;
  }
  if (sum !== 1) return false;
  return true;
};

export const create = async (req: Request, res: Response, next: (error: Error) => any) => {
  try {
    const { body } = req;
    const {
      dataSourceId,
      clusterType,
      paramWeight,
      topologyWeight,
      needCustomizeSimilarityApi,
      similarityApi,
      updateCycle
    } = body;

    if (!await checkReqBody(body)) {
      throw new Error('params not legal');
    }

    const dsView = await retrieveDataSource(dataSourceId);
    if (isFetching(dsView) || needFetchEdges(dsView) || needFetchNodes(dsView)) {
      throw new Error('datasource has not been fully fetched.')
    }

    const newTask = new Task({
      dataSourceId,
      clusterType,
      progress: 0,
      largestLevel: 0,
      needCustomizeSimilarityApi,
      similarityApi,
      updateCycle,
    });
    switch (clusterType) {
      case TaskClusterType.PARAM_AND_TOPOLOGY:
        newTask.set('paramWeight', paramWeight);
        newTask.set('topolopgyWeight', topologyWeight);
        break;
      case TaskClusterType.PARAM_ONLY:
        newTask.set('paramWeight', paramWeight);
        break;
      case TaskClusterType.TOPOLOGY_ONLY:
        newTask.set('topolopgyWeight', topologyWeight);
        break;
      default:
        break;
    }
    await newTask.save();
    res.json({
      message: 'success',
    });
  } catch (error) {
    next(error);
  }
}

export const handleTaskCron = async () => {
  const list = await retrieveTaskWithDataSourceList();
  await Promise.all(list.map(async (task: any) => {
    const { progress, dataSource } = task;
    const dsView = dataSource[0];
    if (isFetching(dsView) || needFetchNodes(dsView) || needFetchEdges(dsView)) {
      return;
    }
    if (progress === 0) {
      await updateTask(task, { progress: 50 });
      return await handleTask(task);
    }
  }));
};