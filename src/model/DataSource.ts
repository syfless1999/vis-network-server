import { Document } from 'mongoose'
import mongoose from 'src/db/mongodbDriver';

export enum DataScale {
  HUNDRED = 'hundred',
  THOUSAND = 'thousand',
  MILLION = 'million',
}

export interface NodeFeature {
  total: number;
  current: number;
  param: Array<string>;
}

export interface EdgeFeature {
  total: number;
  current: number;
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
  scale?: DataScale;
  needExpand: boolean;
  expandSource?: ExpandSource;
}

const dataSourceSchema = new mongoose.Schema({
  name: String,
  url: String,
  node: {
    total: Number,
    current: Number,
    param: [String],
  },
  edge: {
    total: Number,
    current: Number,
    param: [String],
  },
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