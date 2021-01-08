import neo4j, { Session, SessionMode, Transaction } from 'neo4j-driver';
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

export const getSession = (config?: Neo4jSessionConfig, context?: Neo4jContext) => {
  if (context && context.neo4jSession) {
    return context.neo4jSession;
  }
  const session = driver.session(config);
  if (context) {
    context.neo4jSession = session;
  }
  return session;
};

export const runTransaction = async (callback: (txc: Transaction) => Promise<void>) => {
  const session = getSession();
  const txc = session.beginTransaction();
  try {
    await callback(txc);
    await txc.commit();
  } catch (error) {
    await txc.rollback();
  } finally {
    await session.close();
  }
}

export default driver;
