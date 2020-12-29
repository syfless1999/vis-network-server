import DataSource from "src/model/DataSource";

export const retrieve = async () => {
  const list = await DataSource
    .where('url').exists(true)
    .where('name').exists(true)
    .exec();

  return list;
}