require('dotenv').config();
const { sequelize } = require('./models');
const app = require('./app');
const http = require('http');
const setupWebsockets = require('./websockets');
const asteriskService = require('./services/asteriskService');
const setupAsteriskEvents = require('./asterisk-events');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Configurar WebSockets
const io = setupWebsockets(server);

// Iniciar servidor
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida');
    
    // const ariClient = await asteriskService.connect();
    // setupAsteriskEvents(ariClient, io);
    
    server.listen(PORT, () => {
      console.log(`Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

startServer();