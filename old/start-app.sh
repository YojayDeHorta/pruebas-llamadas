#!/bin/bash

echo "================================="
echo "  Iniciando WebRTC Caller App"
echo "================================="
echo ""

# Verificar que Asterisk esté corriendo
if ! pgrep -x "asterisk" > /dev/null; then
    echo "⚠️  Asterisk no está corriendo"
    echo "   Iniciando Asterisk..."
    sudo systemctl start asterisk
    sleep 2
fi

# Verificar WebSocket
echo "Verificando WebSocket..."
if sudo asterisk -rx "http show status" | grep -q "Server Enabled"; then
    echo "✓ WebSocket HTTP habilitado (puerto 8088)"
else
    echo "⚠️  WebSocket no está habilitado"
    echo "   Ejecuta: sudo ./setup-webrtc-sip.sh"
    exit 1
fi

if sudo asterisk -rx "http show status" | grep -q "HTTPS Server Enabled"; then
    echo "✓ WebSocket HTTPS habilitado (puerto 8089)"
else
    echo "⚠️  WebSocket HTTPS no está habilitado"
fi

# Verificar extensiones WebRTC
echo ""
echo "Verificando extensiones WebRTC..."
if sudo asterisk -rx "sip show peers" | grep -q "2000"; then
    echo "✓ Extensión 2000 configurada"
else
    echo "⚠️  Extensión 2000 no encontrada"
fi

if sudo asterisk -rx "sip show peers" | grep -q "2001"; then
    echo "✓ Extensión 2001 configurada"
else
    echo "⚠️  Extensión 2001 no encontrada"
fi

echo ""
echo "================================="
echo "  Estado del Sistema"
echo "================================="
sudo asterisk -rx "sip show peers" | head -10

echo ""
echo "================================="
echo "  Iniciando servidor Node.js"
echo "================================="
echo ""

# Iniciar servidor Node.js
node asterisk-caller-app/server.js