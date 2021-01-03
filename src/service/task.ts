import Task from 'src/model/Task';

export const retrieveTaskList = async () => {
  const aggregate = Task.aggregate();
  const list = await aggregate.lookup({
    from: 'DataSource',
    localField: 'dataSourceId',
    foreignField: '_id',
    as: 'dataSource'
  }).exec();
  return list;
}