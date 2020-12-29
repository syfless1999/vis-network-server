import { dataSourceHandler } from './controller/datasource';

const io = require('socket.io')(null, { cors: true });

// router
io.of('/datasource').on('connection', dataSourceHandler);


export default io;