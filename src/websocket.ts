import { dataSourceSocketHandler } from './controller/datasource';

const io = require('socket.io')(null, { cors: true });

// router
export const dsIO = io.of('/datasource').on('connection', dataSourceSocketHandler);


export default io;