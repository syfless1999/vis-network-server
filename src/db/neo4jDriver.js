const neo4j = require('neo4j-driver');
const config = require('../../config');

const driver = neo4j.driver(
  config.neo4j_url,
  neo4j.auth.basic(
    config.neo4j_username,
    config.neo4j_password,
  ),
);

const getSession = (context) => {
  if (context.neo4jSession) {
    return context.neo4jSession;
  }
  context.neo4jSession = driver.session();
  return context.neo4jSession;
};

module.exports = {
  getSession,
};
