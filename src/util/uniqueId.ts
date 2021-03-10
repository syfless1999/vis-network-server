/**
 * 生成唯一的 ID，规则是序号 + 时间戳
 * @param index 序号
 */
 export const uniqueId = (index: number = 0) => {
  const random1 = `${Math.random()}`.split('.')[1].substr(0, 5);
  const random2 = `${Math.random()}`.split('.')[1].substr(0, 5);
  return `${index}-${random1}${random2}`
};
