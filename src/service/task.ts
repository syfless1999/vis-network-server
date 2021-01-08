import Task from 'src/model/Task';

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