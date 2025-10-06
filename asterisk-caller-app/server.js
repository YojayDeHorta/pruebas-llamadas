// server.js
const express = require('express');
const cors = require('cors');
const AsteriskManager = require('asterisk-manager');

const app = express();
const PORT = 3000;

// Configuración de Asterisk Manager Interface (AMI)
const ami = new AsteriskManager({
  port: 5038,
  host: 'localhost',
  username: 'admin',  // Cambiar según tu configuración
  password: 'secret', // Cambiar según tu configuración
  events: 'on'
});

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a AMI
ami.keepConnected();

ami.on('connect', () => {
  console.log('✓ Conectado a Asterisk AMI');
});

ami.on('error', (err) => {
  console.error('Error AMI:', err);
});

// Endpoint para realizar llamadas
app.post('/api/call', async (req, res) => {
  const { phoneNumber, extension } = req.body;

  if (!phoneNumber || !extension) {
    return res.status(400).json({ 
      error: 'Se requiere número de teléfono y extensión' 
    });
  }

  // Formatear número: añadir 9 + 57 + número (según tu dialplan)
  const dialNumber = `957${phoneNumber}`;

  try {
    // Originar llamada usando AMI
    ami.action({
      action: 'Originate',
      channel: `SIP/${extension}`, // La extensión que contestará primero
      context: 'internal',
      exten: dialNumber,
      priority: 1,
      callerid: `Web Call <${extension}>`,
      timeout: 30000,
      async: true
    }, (err, response) => {
      if (err) {
        console.error('Error al originar llamada:', err);
        return res.status(500).json({ 
          error: 'Error al originar llamada',
          details: err.message 
        });
      }

      if (response.response === 'Success') {
        console.log(`✓ Llamada iniciada: ${extension} -> +57${phoneNumber}`);
        res.json({ 
          success: true, 
          message: 'Llamada iniciada correctamente',
          extension: extension,
          phoneNumber: phoneNumber
        });
      } else {
        console.error('Respuesta AMI:', response);
        res.status(500).json({ 
          error: 'No se pudo iniciar la llamada',
          details: response.message 
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ami_connected: ami.isConnected()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📞 Listo para realizar llamadas a través de Asterisk`);
});

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  ami.disconnect();
  process.exit();
});