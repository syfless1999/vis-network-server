import dotenv from 'dotenv';

dotenv.config();
const config = {
  neo4j_url: process.env.NEO4j_DATABASE_URL,
  neo4j_username: process.env.NEO4j_DATABASE_USERNAME,
  neo4j_password: process.env.NEO4j_DATABASE_PASSWORD,
  mongodb_url: process.env.MONGODB_DATABASE_URL,
  need_update_datasource: process.env.NEED_UPDATE_DATASOURCE,
  update_datasource_interval: Number(process.env.UPDATE_DATASOURCE_INTERVAL),
};
export default config;
