import { Socket } from 'socket.io';

function socketHandler(socket: Socket) {
  console.log('happy connected')

  socket.on('chat message', (msg: string) => {
    console.log(msg)
    socket.emit('chat message', `message from socket server ${msg}`)
  });

  socket.on('disconnect', () => {
    console.log('connect down');
  });
}

export default socketHandler;