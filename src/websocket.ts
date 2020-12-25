import { Socket } from 'socket.io';

const io = require('socket.io')(null, { cors: true });
io.on('connection', socketHandler);

function socketHandler(socket: Socket) {
  console.log('connect on')

  socket.on('chat message', (msg: string) => {
    socket.emit('chat message', `message from socket server ${msg}`)
  });

  socket.on('disconnect', () => {
    console.log('connect down');
  });
}

export default io;