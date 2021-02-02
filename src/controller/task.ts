import { Request, Response } from 'express';
import { runTransaction } from 'src/db/neo4jDriver';
import Task, { TaskClusterType } from 'src/model/Task';
import { retrieveDataSource } from 'src/service/datasource';
import { retrieveTaskWithDataSourceList } from 'src/service/task';
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
      return next(new Error('params not legal'));
    }

    const newTask = new Task({
      dataSourceId,
      clusterType,
      progress: 0,
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


const handleEachTask = async (task: any) => {
  const { dataSource } = task;
  const { name, node: { total } } = dataSource[0];
  let current = 0;
  let step = 10;
  runTransaction(async (txc) => {
    while (current < total) {
      let [start, end, length] = [current, current + step, step];
      // 1. 创建社团
      // 2. 给节点标记社团
      const result = await txc.run(
        `MATCH (n:${name}) RETURN n as node`
      );
    }

    // result.records.forEach(record => {
    //   console.log(record.get('node'));
    // });
    // const nodeCount = result.records[0].get('nodeCount').low;
    // const edgeCount = result.records[0].get('edgeCount').low;
    // console.log(HCluster.add(nodeCount, edgeCount));
  });
}
export const handleTaskCron = async () => {
  const list = await retrieveTaskWithDataSourceList();
  for (const task of list) {
    if (task.progress !== 100) {
      // handleEachTask(task);
    }
  }
};