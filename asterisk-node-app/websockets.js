const socketIo = require('socket.io');
const asteriskService = require('./services/asteriskService');

function setupWebsockets(server) {
  const io = socketIo(server);
  
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    socket.on('register', (data) => {
      const userId = data.userId;
      socket.join(`user:${userId}`);
    });
    
    socket.on('makeCall', async (data) => {
      try {
        const { extension, destination } = data;
        const callId = await asteriskService.initiateCall(extension, destination);
        io.to(`user:${data.userId}`).emit('callStatus', { 
          status: 'initiating', 
          callId 
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  // Función global para notificaciones
  global.notifyUser = (userId, eventType, data) => {
    io.to(`user:${userId}`).emit(eventType, data);
  };
  
  return io;
}

module.exports = setupWebsockets;