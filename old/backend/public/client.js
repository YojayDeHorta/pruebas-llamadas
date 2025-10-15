// Conexión al servidor de Socket.IO
const socket = io();

// Elementos del DOM
const joinButton = document.getElementById('joinButton');
const roomNameInput = document.getElementById('roomNameInput');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let roomName;
const peers = {}; // Objeto para almacenar las conexiones de cada par

// Configuración de servidores STUN (necesarios para atravesar NATs)
const stunServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// --- Lógica de la Aplicación ---

joinButton.onclick = () => {
    roomName = roomNameInput.value;
    if (!roomName) {
        return alert('Por favor, introduce un nombre de sala.');
    }

    startCall();
};

async function startCall() {
    // 1. Obtener acceso al micrófono y (opcionalmente) cámara
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error("Error al acceder a los medios:", error);
        alert("No se pudo acceder al micrófono/cámara.");
        return;
    }

    // Ahora que tenemos el stream, podemos empezar a manejar la lógica de WebRTC.
    // Nos unimos a la sala y el servidor notificará a otros.
    socket.emit('join-room', roomName);

    // Deshabilitar el botón para no unirse dos veces
    joinButton.disabled = true;
    roomNameInput.disabled = true;
}

function createPeerConnection(remoteSocketId) {
    // Si ya existe una conexión para este par, no hagas nada y devuélvela.
    if (peers[remoteSocketId]) {
        return peers[remoteSocketId];
    }

    // Si localStream no está listo, no podemos continuar.
    if (!localStream) {
        console.error("localStream no está listo. No se pueden añadir tracks.");
        return; // Retorna undefined, el código que llama debe manejarlo.
    }

    // 2. Crear la conexión RTCPeerConnection
    const peerConnection = new RTCPeerConnection(stunServers);
    peers[remoteSocketId] = peerConnection; // Almacenar la conexión

    // 3. Añadir los tracks de audio/video locales a la conexión
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // 4. Escuchar por tracks remotos (solo mostramos el primer stream remoto)
    peerConnection.ontrack = event => {
        if (!remoteVideo.srcObject) remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: remoteSocketId,
                candidate: event.candidate,
            });
        }
    };

    return peerConnection;
}

// --- Manejo de Eventos de Señalización (Socket.IO) ---

// Un nuevo usuario se une, el iniciador de la llamada crea la oferta
socket.on('user-joined', async (senderId) => {
    console.log('Otro usuario se ha unido:', senderId);
    
    const peerConnection = createPeerConnection(senderId);
    // Si la conexión no se pudo crear (porque localStream no estaba listo), detenemos.
    if (!peerConnection) {
        console.warn(`No se pudo crear la conexión para ${senderId} porque el stream local no está listo.`);
        return;
    }

    // 6. Crear una oferta SDP
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // 7. Enviar la oferta al nuevo usuario
    socket.emit('offer', {
        target: senderId,
        sdp: peerConnection.localDescription,
    });
});

// El receptor de la llamada recibe la oferta
socket.on('offer', async (payload) => {
    console.log('Oferta recibida de:', payload.sender);

    const peerConnection = createPeerConnection(payload.sender);
    // Si la conexión no se pudo crear, detenemos.
    if (!peerConnection) {
        console.warn(`No se pudo procesar la oferta de ${payload.sender} porque el stream local no está listo.`);
        return;
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

    // 8. Crear una respuesta SDP
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // 9. Enviar la respuesta al iniciador
    socket.emit('answer', {
        target: payload.sender,
        sdp: peerConnection.localDescription,
    });
});

// El iniciador de la llamada recibe la respuesta
socket.on('answer', async (payload) => {
    console.log('Respuesta recibida de:', payload.sender);
    const peerConnection = peers[payload.sender];
    if (!peerConnection) {
        return console.error(`No se encontró una conexión para el par ${payload.sender} al recibir una respuesta.`);
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
});

// Ambos pares reciben los candidatos ICE del otro
socket.on('ice-candidate', async (payload) => {
    const peerConnection = peers[payload.sender];
    if (!peerConnection) {
        return console.error(`No se encontró una conexión para el par ${payload.sender} al recibir un candidato ICE.`);
    }

    if (payload.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
});

// Un usuario se ha desconectado
socket.on('user-left', (socketId) => {
    console.log('El usuario', socketId, 'se ha desconectado.');
    const peerConnection = peers[socketId];
    if (peerConnection) {
        peerConnection.close();
        delete peers[socketId];
    }

    // Si no quedan más pares, limpiar el video remoto
    if (Object.keys(peers).length === 0) {
        remoteVideo.srcObject = null;
    }
});
