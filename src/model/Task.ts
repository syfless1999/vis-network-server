import mongoose, { Document } from 'mongoose';

export enum TaskClusterType {
  PARAM_ONLY = 'PARAM',
  TOPOLOGY_ONLY = 'TOPOLOGY',
  PARAM_AND_TOPOLOGY = 'ALL',
}

export interface TaskDocument extends Document {
  dataSourceId: mongoose.Schema.Types.ObjectId;
  clusterType: string;
  paramWeight: Array<string | number>;
  progress: number;
  topologyWeight: number;
  needCustomizeSimilarityApi: boolean;
  similarityApi: string;
  updateCycle: number;
}

const taskSchema = new mongoose.Schema({
  dataSourceId: mongoose.Schema.Types.ObjectId,
  clusterType: String,
  paramWeight: [],
  topologyWeight: Number,
  progress: Number,
  needCustomizeSimilarityApi: Boolean,
  similarityApi: String,
  updateCycle: Number,
});


const Task = mongoose.model<TaskDocument>('Task', taskSchema);

export default Task;