// server-webrtc.js
// Servidor para aplicación WebRTC (mismo servidor que Asterisk)
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const HTTP_PORT = 3500;
const HTTPS_PORT = 3443;

// Middleware para servir archivos estáticos
app.use(express.static(__dirname));
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'WebRTC Server running',
        asterisk: 'localhost:8088'
    });
});

// API para obtener configuración (opcional)
app.get('/api/config', (req, res) => {
    res.json({
        sipServer: 'localhost',
        wsServerHTTP: 'ws://localhost:8088/ws',
        wsServerHTTPS: 'wss://localhost:8089/ws'
    });
});

// Iniciar servidor HTTP
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('🚀 Servidor WebRTC Iniciado');
    console.log('=================================');
    console.log(`🌐 HTTP:  http://localhost:${HTTP_PORT}`);
    console.log(`📱 Local: http://127.0.0.1:${HTTP_PORT}`);
    console.log(`🌍 Red:   http://0.0.0.0:${HTTP_PORT}`);
});

// Intentar iniciar servidor HTTPS
try {
    const httpsOptions = {
        key: fs.readFileSync('/etc/asterisk/keys/asterisk.key'),
        cert: fs.readFileSync('/etc/asterisk/keys/asterisk.pem')
    };

    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        console.log(`🔒 HTTPS: https://localhost:${HTTPS_PORT}`);
        console.log('=================================');
        console.log('');
        console.log('✓ Asterisk WebSocket: ws://localhost:8088/ws');
        console.log('✓ Asterisk WebSocket Secure: wss://localhost:8089/ws');
        console.log('');
        console.log('📝 Nota: Acepta el certificado en el navegador');
        console.log('=================================\n');
    });
} catch (error) {
    console.log('\n⚠️  HTTPS no disponible:', error.message);
    console.log('   Ejecuta: sudo ./setup-webrtc-sip.sh\n');
}

// Manejo de cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});