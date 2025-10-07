#!/bin/bash
# Script para configurar Asterisk WebRTC con SIP (no PJSIP)

echo "==================================="
echo "Configuración WebRTC con SIP"
echo "==================================="

# 1. Crear directorio para certificados
echo "Creando directorio para certificados..."
sudo mkdir -p /etc/asterisk/keys
cd /etc/asterisk/keys

# 2. Generar certificado autofirmado
echo "Generando certificado SSL..."
sudo openssl req -new -x509 -days 365 -nodes -out asterisk.pem -keyout asterisk.key \
    -subj "/C=CO/ST=Bogota/L=Bogota/O=WebRTC/CN=68.211.177.70"

# 3. Permisos correctos
sudo chown asterisk:asterisk /etc/asterisk/keys/*
sudo chmod 600 /etc/asterisk/keys/*

echo "✓ Certificados creados"

# 4. Backup de configuraciones
echo ""
echo "Haciendo backup..."
sudo cp /etc/asterisk/http.conf /etc/asterisk/http.conf.backup
sudo cp /etc/asterisk/sip.conf /etc/asterisk/sip.conf.backup

# 5. Configurar http.conf para WebSocket
echo ""
echo "Configurando http.conf..."
sudo tee /etc/asterisk/http.conf > /dev/null << 'EOF'
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/etc/asterisk/keys/asterisk.pem
tlsprivatekey=/etc/asterisk/keys/asterisk.key
EOF

# 6. Añadir extensiones WebRTC a sip.conf
echo ""
echo "Añadiendo extensiones WebRTC a sip.conf..."
sudo tee -a /etc/asterisk/sip.conf > /dev/null << 'EOF'

; ===================================
; Configuración WebRTC con SIP
; ===================================

; Extensión WebRTC 2000
[2000]
type=friend
context=internal
host=dynamic
secret=webrtc2000
encryption=yes
avpf=yes
icesupport=yes
directmedia=no
transport=ws,wss
force_avp=yes
dtlsenable=yes
dtlsverify=no
dtlscertfile=/etc/asterisk/keys/asterisk.pem
dtlsprivatekey=/etc/asterisk/keys/asterisk.key
dtlssetup=actpass
rtcp_mux=yes
disallow=all
allow=opus
allow=ulaw
allow=alaw
nat=force_rport,comedia
qualify=yes
dtmfmode=rfc2833
insecure=invite,port

; Extensión WebRTC 2001
[2001]
type=friend
context=internal
host=dynamic
secret=webrtc2001
encryption=yes
avpf=yes
icesupport=yes
directmedia=no
transport=ws,wss
force_avp=yes
dtlsenable=yes
dtlsverify=no
dtlscertfile=/etc/asterisk/keys/asterisk.pem
dtlsprivatekey=/etc/asterisk/keys/asterisk.key
dtlssetup=actpass
rtcp_mux=yes
disallow=all
allow=opus
allow=ulaw
allow=alaw
nat=force_rport,comedia
qualify=yes
dtmfmode=rfc2833
insecure=invite,port
EOF

# 7. Verificar que rtp.conf tenga el rango correcto
echo ""
echo "Configurando RTP..."
sudo tee /etc/asterisk/rtp.conf > /dev/null << 'EOF'
[general]
rtpstart=10000
rtpend=20000
icesupport=yes
stunaddr=stun.l.google.com:19302
EOF

# 8. Configurar firewall
echo ""
echo "Configurando firewall..."
sudo ufw allow 8088/tcp comment "WebSocket HTTP"
sudo ufw allow 8089/tcp comment "WebSocket HTTPS"
sudo ufw allow 10000:20000/udp comment "RTP"

# 9. Recargar Asterisk
echo ""
echo "Recargando Asterisk..."
sudo asterisk -rx "http reload"
sudo asterisk -rx "sip reload"
sudo asterisk -rx "rtp reload"
sudo asterisk -rx "core reload"

# 10. Verificar configuración
echo ""
echo "==================================="
echo "Verificando configuración..."
echo "==================================="
sudo asterisk -rx "http show status"
sudo asterisk -rx "sip show peers" | grep 2000
sudo asterisk -rx "sip show peers" | grep 2001

echo ""
echo "==================================="
echo "✓ Configuración completada"
echo "==================================="
echo ""
echo "Extensiones WebRTC creadas:"
echo "  - Usuario: 2000 | Password: webrtc2000"
echo "  - Usuario: 2001 | Password: webrtc2001"
echo ""
echo "Próximos pasos:"
echo "1. Abre puertos en Azure NSG:"
echo "   - TCP 8088, 8089, 3443"
echo "   - UDP 10000-20000"
echo ""
echo "2. Verifica WebSocket:"
echo "   sudo netstat -tlnp | grep 8088"
echo "   sudo netstat -tlnp | grep 8089"
echo ""
echo "3. Prueba las extensiones:"
echo "   sudo asterisk -rx 'sip show peers'"
echo ""