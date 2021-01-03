import mongoose, { Document } from 'mongoose';

export enum TaskClusterType {
  PARAM_ONLY = 'PARAM_ONLY',
  TOPOLOGY_ONLY = 'TOPOLOGY_ONLY',
  PARAM_AND_TOPOLOGY = 'PARAM_AND_TOPOLOGY',
}

export interface TaskDocument extends Document {

}

const taskSchema = new mongoose.Schema({
  dataSourceId: mongoose.Schema.Types.ObjectId,
  clusterType: TaskClusterType,
  paramWeight: [],
  topologyWeight: Number,
  needCustomizeSimilarityApi: Boolean,
  similarityApi: String,
  updateCycle: Number,
});


const Task = mongoose.model<TaskDocument>('Task', taskSchema);

export default Task;