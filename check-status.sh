#!/bin/bash

echo "=========================================="
echo "  Estado de Asterisk WebRTC"
echo "=========================================="
echo ""

# 1. Verificar Asterisk
echo "1. Asterisk:"
if pgrep -x "asterisk" > /dev/null; then
    echo "   ✓ Asterisk está corriendo"
else
    echo "   ✗ Asterisk NO está corriendo"
    echo "   → sudo systemctl start asterisk"
fi

echo ""

# 2. Verificar HTTP/WebSocket
echo "2. HTTP/WebSocket:"
sudo asterisk -rx "http show status"

echo ""

# 3. Verificar puertos
echo "3. Puertos escuchando:"
echo "   Puerto 5060 (SIP):"
if sudo netstat -tlnp | grep ":5060" > /dev/null; then
    echo "   ✓ Puerto 5060 abierto"
    sudo netstat -tlnp | grep ":5060"
else
    echo "   ✗ Puerto 5060 no está escuchando"
fi

echo ""
echo "   Puerto 8088 (WebSocket HTTP):"
if sudo netstat -tlnp | grep ":8088" > /dev/null; then
    echo "   ✓ Puerto 8088 abierto"
    sudo netstat -tlnp | grep ":8088"
else
    echo "   ✗ Puerto 8088 no está escuchando"
fi

echo ""
echo "   Puerto 8089 (WebSocket HTTPS):"
if sudo netstat -tlnp | grep ":8089" > /dev/null; then
    echo "   ✓ Puerto 8089 abierto"
    sudo netstat -tlnp | grep ":8089"
else
    echo "   ✗ Puerto 8089 no está escuchando"
fi

echo ""

# 4. Verificar certificados
echo "4. Certificados SSL:"
if [ -f "/etc/asterisk/keys/asterisk.pem" ]; then
    echo "   ✓ Certificado existe"
    ls -lh /etc/asterisk/keys/
else
    echo "   ✗ Certificado no existe"
    echo "   → sudo ./setup-webrtc-sip.sh"
fi

echo ""

# 5. Verificar extensiones SIP
echo "5. Extensiones SIP:"
sudo asterisk -rx "sip show peers"

echo ""

# 6. Verificar RTP
echo "6. Configuración RTP:"
sudo asterisk -rx "rtp show settings" | head -5

echo ""

# 7. Test de WebSocket
echo "7. Test WebSocket (HTTP):"
timeout 2 curl -i -N \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Host: localhost:8088" \
    -H "Origin: http://localhost:8088" \
    http://localhost:8088/ws 2>&1 | head -5

echo ""
echo "=========================================="
echo "  URLs de acceso:"
echo "=========================================="
echo "  HTTP:  http://localhost:3000"
echo "  HTTPS: https://localhost:3443"
echo ""
echo "  Asterisk WS:  ws://localhost:8088/ws"
echo "  Asterisk WSS: wss://localhost:8089/ws"
echo "=========================================="
echo ""