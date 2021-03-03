import mongoose from 'mongoose';

type ObjectId = mongoose.Types.ObjectId;


export const objectId2String = (oId: ObjectId): string => {
  return /\w{24}/.exec(oId.toString())[0];
}

export const string2ObjectId = (str: string): ObjectId => {
  return mongoose.Types.ObjectId(str);
}