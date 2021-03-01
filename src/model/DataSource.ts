import { Document } from 'mongoose'
import mongoose from 'src/db/mongodbDriver';

export enum DataScale {
  HUNDRED = 'hundred',
  THOUSAND = 'thousand',
  MILLION = 'million',
}

export interface NodeProperty {
  total: number;
  current: number;
  param: Array<string>;
}

export interface EdgeProperty {
  total: number;
  current: number;
  param: Array<string>;
}
export interface ExpandSource {
  url: string;
  updateCycle: number;
}

export interface DataSourceDocument extends Document {
  name: string;
  url: string;
  node: NodeProperty;
  edge: EdgeProperty;
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