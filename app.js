#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('vis-network:server');
const http = require('http');
const app = require('./src/index');

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const newPort = parseInt(val, 10);

  if (Number.isNaN(newPort)) {
    // named pipe
    return val;
  }

  if (newPort >= 0) {
    // port number
    return newPort;
  }

  return false;
}

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
