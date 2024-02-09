const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = {};

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
});

io.on('connection', socket => {
  socket.on('new-user', name => {
    users[socket.id] = name;
    // Notify the connected user about all existing users
    socket.emit('existing-users', Object.values(users));
    // Broadcast the new user to all other users
    socket.broadcast.emit('new-user-joined', name);
  });

  socket.on('send-chat-message', data => {
    console.log(`Message received from ${users[socket.id]}: ${data.message}`);
    socket.broadcast.emit('chat-message', { message: data.message, sender: data.sender });
    console.log(`Message emitted to all clients except the sender`);
  });
  

  socket.on('disconnect', () => {
    io.emit('user-disconnected', users[socket.id]);
    delete users[socket.id];
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
