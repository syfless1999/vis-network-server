import Task, { TaskClusterType } from 'src/model/Task';
import { isFetching, needFetchEdges, needFetchNodes, retrieveDataSource } from 'src/service/datasource';
import { retrieveTaskWithDataSourceList, updateTask } from 'src/service/task';
import { findCrossLevelEdges, retrieveCompleteLayer, saveEdges, saveLayer } from 'src/service/Network';
import { testClusterNetwork } from 'src/util/testCluster';
import { getJoinString, objectId2String } from 'src/util/string';
import { cronDebug } from 'src/util/debug';
import { Controller } from 'src/type/express';

export const retrieve: Controller = async (req, res, next) => {
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

export const create: Controller = async (req, res, next) => {
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

const handleTask = async (task: any) => {
  const { dataSource, _id } = task;
  const taskId = objectId2String(_id);
  const { name } = dataSource[0];
  cronDebug(`Handle Task [${name}:${taskId}] Start`);
  // 1. get source network data
  const layer = await retrieveCompleteLayer(name);
  // 2. n-cluster network
  const layerNetwork = testClusterNetwork(layer);
  // 3. data process(add taskId for cluster)
  const completeLayerNetwork = [];
  for (let index = 1; index < layerNetwork.length; index++) {
    const layer = layerNetwork[index];
    const { nodes, edges } = layer;
    const layerWithTaskId = {
      nodes: nodes.map(node => ({ ...node, taskId })),
      edges: edges.map(edge => ({ ...edge, taskId })),
    };
    completeLayerNetwork.push(layerWithTaskId);
  }
  // 4. save layer network to neo4j
  for (let i = 0; i < completeLayerNetwork.length; i += 1) {
    const layer = completeLayerNetwork[i];
    await saveLayer(layer, name);
  }
  // 5. create edge from 
  const crossLevelEdges = findCrossLevelEdges(layerNetwork);
  const includeEdgeLabel = getJoinString(name, 'include');
  await saveEdges(crossLevelEdges, name, includeEdgeLabel);
  // 6. update task info
  await updateTask(task, {
    progress: 100,
    largestLevel: layerNetwork.length - 1,
  });
  cronDebug(`Handle Task [${name}:${taskId}] Finish`);
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