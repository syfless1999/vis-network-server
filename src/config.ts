import dotenv from 'dotenv';

dotenv.config();
const config = {
  neo4j_url: process.env.NEO4j_DATABASE_URL,
  neo4j_username: process.env.NEO4j_DATABASE_USERNAME,
  neo4j_password: process.env.NEO4j_DATABASE_PASSWORD,
};
export default config;
