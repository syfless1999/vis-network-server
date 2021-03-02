import { saveEdges, saveLayer, saveNodes } from 'src/model/Network';
import Task, { TaskClusterType } from 'src/model/Task';
import { testClusterNetwork } from 'src/util/testCluster';
import { retrieveNetworkAndEdgeByLevelAndLabel } from './network';

export const retrieveTaskList = async () => {
  const list = await Task.find().exec();
  return list;
}

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

export const handleTask = async (task: any) => {
  const { dataSource } = task;
  const { name } = dataSource[0];
  const layer = await retrieveNetworkAndEdgeByLevelAndLabel(name, 0);
  const layerNetwork = testClusterNetwork(layer, 3);
  for (let index = 1; index < layerNetwork.length; index++) {
    const layer = layerNetwork[index];
    await saveLayer(layer, name);
  }
}

export const updateTaskProgress = async (task: any, newProgress: number) => {
  const { _id } = task;
  await Task.findByIdAndUpdate(_id, { progress: newProgress });
}
