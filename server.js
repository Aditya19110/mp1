const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {}; 
const roomUsernamesMap = {};  

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        if (roomUsernamesMap[roomId] && roomUsernamesMap[roomId].includes(username)) {
            console.log(`${username} is already in the room ${roomId}`);
            socket.emit(ACTIONS.ERROR, { message: `${username} is already in the room` });
            return;
        }

        userSocketMap[socket.id] = username;

        if (!roomUsernamesMap[roomId]) {
            roomUsernamesMap[roomId] = [];
        }
        roomUsernamesMap[roomId].push(username);

        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        io.to(roomId).emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

            if (roomUsernamesMap[roomId]) {
                roomUsernamesMap[roomId] = roomUsernamesMap[roomId].filter((username) => username !== userSocketMap[socket.id]);
            }
        });

        delete userSocketMap[socket.id];
        socket.leave(); 
    });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));