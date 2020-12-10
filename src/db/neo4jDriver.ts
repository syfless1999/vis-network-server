import neo4j, { Session } from 'neo4j-driver';
import { Request } from 'express';
import config from 'src/config';

export interface Neo4jContext extends Request {
  neo4jSession?: Session;
}

const driver = neo4j.driver(
  config.neo4j_url,
  neo4j.auth.basic(
    config.neo4j_username,
    config.neo4j_password,
  ),
);

export const getSession = (context: Neo4jContext) => {
  if (context.neo4jSession) {
    return context.neo4jSession;
  }
  context.neo4jSession = driver.session();
  return context.neo4jSession;
};

