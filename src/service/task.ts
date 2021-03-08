import { saveLayer } from 'src/service/Network';
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
  const layer = await retrieveCompleteSourceNetwork(name);
  const layerNetwork = testClusterNetwork(layer, 3);
  for (let index = 1; index < layerNetwork.length; index++) {
    const layer = layerNetwork[index];
    const { nodes, edges } = layer;
    const layerWithTaskId = {
      nodes: nodes.map(node => ({ ...node, taskId })),
      edges: edges.map(edge => ({ ...edge, taskId })),
    };
    await saveLayer(layerWithTaskId, name);
  }
  await updateTask(task, {
    progress: 100,
    largestLevel: layerNetwork.length - 1,
  });
}
