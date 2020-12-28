import neo4j, { Session, SessionMode } from 'neo4j-driver';
import { Request } from 'express';
import config from 'src/config';

export interface Neo4jContext extends Request {
  neo4jSession?: Session;
}
export interface Neo4jSessionConfig {
  defaultAccessMode?: SessionMode;
  bookmarks?: string | string[];
  fetchSize?: number;
  database?: string;
}

const driver = neo4j.driver(
  config.neo4j_url,
  neo4j.auth.basic(
    config.neo4j_username,
    config.neo4j_password,
  ),
);

export const getSession = (context?: Neo4jContext, config?: Neo4jSessionConfig) => {
  if (context && context.neo4jSession) {
    return context.neo4jSession;
  }
  const session = driver.session(config);
  if (context) {
    context.neo4jSession = session;
  }
  return session;
};

export default driver;
