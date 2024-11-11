const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);

// Maps socket IDs to usernames and usernames to socket IDs
const userSocketMap = {}; 
const roomUsernamesMap = {};  // Maps roomId to a list of usernames in the room

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

    // Event when a user joins a room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        // Check if the username already exists in the room
        if (roomUsernamesMap[roomId] && roomUsernamesMap[roomId].includes(username)) {
            console.log(`${username} is already in the room ${roomId}`);
            socket.emit(ACTIONS.ERROR, { message: `${username} is already in the room` });
            return; // Don't add the user again if already in the room
        }

        userSocketMap[socket.id] = username;

        // Add username to the list of usernames for that room
        if (!roomUsernamesMap[roomId]) {
            roomUsernamesMap[roomId] = [];
        }
        roomUsernamesMap[roomId].push(username);

        socket.join(roomId);

        // Emit JOINED event to all clients in the room
        const clients = getAllConnectedClients(roomId);
        io.to(roomId).emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });

    // Event when the user disconnects
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            // Notify others in the room about the disconnection
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

            // Remove the user from the list of usernames in the room
            if (roomUsernamesMap[roomId]) {
                roomUsernamesMap[roomId] = roomUsernamesMap[roomId].filter((username) => username !== userSocketMap[socket.id]);
            }
        });

        // Clean up the user socket map
        delete userSocketMap[socket.id];
        socket.leave(); // Make sure to leave all rooms
    });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));