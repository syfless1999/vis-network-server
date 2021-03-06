import Task from 'src/model/Task';
import { string2ObjectId } from 'src/util/string';

export const readTaskList = async () => {
  const list = await Task.find().exec();
  return list;
}

export const readOneTaskWithDataSource = async (taskId: string) => {
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

export const readTaskWithDataSourceList = async () => {
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
