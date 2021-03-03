import { saveLayer } from 'src/service/Network';
import Task from 'src/model/Task';
import { testClusterNetwork } from 'src/util/testCluster';
import { retrieveSourceNetwork } from './network';
import { objectId2String } from 'src/util/mongodb';

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
  const { dataSource, _id } = task;
  const taskId= objectId2String(_id);
  const { name } = dataSource[0];
  const layer = await retrieveSourceNetwork(name);
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
}

export const updateTaskProgress = async (task: any, newProgress: number) => {
  const { _id } = task;
  await Task.findByIdAndUpdate(_id, { progress: newProgress });
}
