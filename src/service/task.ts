import { retrieveCrossLayerEdges, saveEdges, saveLayer, updateNodes } from 'src/service/Network';
import Task from 'src/model/Task';
import { testClusterNetwork } from 'src/util/testCluster';
import { retrieveCompleteSourceNetwork } from './network';
import { objectId2String, string2ObjectId } from 'src/util/mongodb';

export const retrieveTaskList = async () => {
  const list = await Task.find().exec();
  return list;
}

export const retrieveOneTask = async (taskId: string) => {
  const aggregate = Task.aggregate([{
    $match: {
      _id: string2ObjectId(taskId),
    }
  }]);
  const tasks = await aggregate.lookup({
    from: 'datasources',
    localField: 'dataSourceId',
    foreignField: '_id',
    as: 'dataSource'
  }).exec();
  return tasks[0];
};

export const retrieveTaskWithDataSourceList = async () => {
  const aggregate = Task.aggregate();
  const list = await aggregate.lookup({
    from: 'datasources',
    localField: 'dataSourceId',
    foreignField: '_id',
    as: 'dataSource'
  }).exec();
  return list;
}

export const updateTask = async (task: any, newProperties: object) => {
  const { _id } = task;
  await Task.findByIdAndUpdate(_id, newProperties);
}

export const handleTask = async (task: any) => {
  const { dataSource, _id } = task;
  const taskId = objectId2String(_id);
  const { name } = dataSource[0];
  // 1. get source network data
  const layer = await retrieveCompleteSourceNetwork(name);
  // 2. n-cluster network
  const layerNetwork = testClusterNetwork(layer, 3);
  const completeLayerNetwork = [];
  // 3. data process(add taskId for cluster)
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
  completeLayerNetwork.forEach(async (layer) => {
    await saveLayer(layer, name);
  });
  // 5. create edge from 
  const crossLayerEdges = retrieveCrossLayerEdges(layerNetwork);

  const saveEdgesTask = saveEdges(crossLayerEdges, name);
  // 6. update task info
  const updateTaskInfo = updateTask(task, {
    progress: 100,
    largestLevel: layerNetwork.length - 1,
  });
  await Promise.all([saveEdgesTask, updateTaskInfo]);
}
