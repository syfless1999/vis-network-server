import mongoose from 'mongoose';

type ObjectId = mongoose.Types.ObjectId;


export const objectId2String = (oId: ObjectId): string => {
  return /\w{24}/.exec(oId.toString())[0];
}

export const string2ObjectId = (str: string): ObjectId => {
  return mongoose.Types.ObjectId(str);
}

/**
 * 生成唯一的 ID，规则是序号 + 时间戳
 * @param index 序号
 */
export const uniqueId = (index: number = 0) => {
  const random1 = `${Math.random()}`.split('.')[1].substr(0, 5);
  const random2 = `${Math.random()}`.split('.')[1].substr(0, 5);
  return `${index}-${random1}${random2}`
};

export const getJoinString = (...args: string[]) => {
  return args.join('_');
}

/**
 * trans props object to cypher query param
 * @param props props need to trans
 * @returns cypher query param
 */
export const props2CypherParam = (props: object) => {
  if (!props) return '';
  const keys = Object.keys(props);
  const strs = keys.map((k) => `${k}:$${k}`);
  return `{ ${strs.join(',')} }`;
}