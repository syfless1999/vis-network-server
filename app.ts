import _debug = require('debug');
import http from 'http';
import io from 'src/websocket';
import app from './src/express';
import jobs from './src/cron';

const debug = _debug('vis-network:server');

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * express app load
 */
const server = http.createServer(app);

/**
 * socket.io listen
 */
io.listen(server);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * cron task start
 */
jobs.forEach((job) => job && job.start())

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: number | string | boolean) {
  const newPort = parseInt(val as string, 10);

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

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: any) {
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
