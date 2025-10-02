// 1. Importar las librerías necesarias
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Cargar variables de entorno desde .env (útil para desarrollo local, no para Docker)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// 2. Configuración inicial
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app); // Creamos el servidor para Socket.IO
const io = new Server(server, {
    cors: {
        // Para producción, deberías restringir esto al dominio de tu frontend.
        // Ejemplo: origin: "https://mi-dominio-frontend.com"
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
}); // Adjuntamos Socket.IO al servidor

// 3. Servir los archivos estáticos del cliente (la carpeta 'public')
app.use(express.static('public'));

// 4. Lógica del servidor de señalización con Socket.IO
io.on('connection', (socket) => {
    console.log(`Un usuario se ha conectado: ${socket.id}`);

    // Evento para unirse a una sala (una "llamada")
    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        console.log(`Usuario ${socket.id} se unió a la sala ${roomName}`);
        // Notificar a los otros en la sala que un nuevo par se ha unido
        socket.to(roomName).emit('user-joined', socket.id);
    });

    // Reenviar la oferta de WebRTC al otro usuario en la sala
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', {
            sdp: payload.sdp,
            sender: socket.id
        });
    });

    // Reenviar la respuesta de WebRTC al iniciador de la llamada
    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', {
            sdp: payload.sdp,
            sender: socket.id
        });
    });

    // Reenviar los candidatos ICE
    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', {
            candidate: payload.candidate,
            sender: socket.id
        });
    });

    // Manejar la desconexión de un usuario
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        // Aquí podrías notificar a otros en la sala si es necesario
    });
});

// 5. Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor de señalización escuchando en el puerto ${PORT}`);
});
