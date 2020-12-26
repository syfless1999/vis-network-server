import { Document } from 'mongoose'
import mongoose from 'src/db/mongodbDriver';

export enum DataScale {
  HUNDRED = 'hundred',
  THOUSAND = 'thousand',
  MILLION = 'million',
}

export interface NodeFeature {
  count: number;
  param: Array<string>;
}

export interface EdgeFeature {
  count: number;
  param: Array<string>;
}
export interface ExpandSource {
  url: string;
  updateCycle: number;
}

export interface DataSourceDocument extends Document {
  id: string;
  name: string;
  url: string;
  node: NodeFeature;
  edge: EdgeFeature;
  progress: number;
  scale?: DataScale;
  needExpand: boolean;
  expandSource?: ExpandSource;
}

const dataSourceSchema = new mongoose.Schema({
  name: String,
  url: String,
  node: {
    count: Number,
    param: [String],
  },
  edge: {
    count: Number,
    param: [String],
  },
  progress: Number,
  scale: {
    default: DataScale.HUNDRED,
    type: String,
  },
  needExpand: Boolean,
  expandSource: {
    url: String,
    updateCycle: Number,
  },
});

const DataSource = mongoose.model<DataSourceDocument>('DataSource', dataSourceSchema);


export default DataSource;