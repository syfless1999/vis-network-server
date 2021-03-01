import { runTransaction } from 'src/db/neo4jDriver';
import Task from 'src/model/Task';
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
  const { name, node: { total } } = dataSource[0];
  const layer = await retrieveNetworkAndEdgeByLevelAndLabel(name, 0);
  const layerNetwork = testClusterNetwork(layer, 3);
  console.log(layerNetwork);
}
