import dotenv from 'dotenv';

dotenv.config();
const config = {
  neo4j_url: process.env.NEO4j_DATABASE_URL,
  neo4j_username: process.env.NEO4j_DATABASE_USERNAME,
  neo4j_password: process.env.NEO4j_DATABASE_PASSWORD,
  mongodb_url: process.env.MONGODB_DATABASE_URL,
  need_update_datasource: Boolean(process.env.NEED_UPDATE_DATASOURCE),
  datasource_fetch_length: Number(process.env.DATASOURCE_FETCH_LENGTH),
  datasource_update_cron: process.env.DATASOURCE_UPDATE_CRON,
  need_task_handle: Boolean(process.env.NEED_TASK_HANDLE),
  task_handle_cron: process.env.TASK_HANDLE_CRON,
};
export default config;
