// Conexión al servidor de Socket.IO
const socket = io();

// Elementos del DOM
const joinButton = document.getElementById('joinButton');
const roomNameInput = document.getElementById('roomNameInput');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
let roomName;

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

    // Unirse a la sala y empezar el proceso
    socket.emit('join-room', roomName);
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

    // Deshabilitar el botón para no unirse dos veces
    joinButton.disabled = true;
    roomNameInput.disabled = true;
}

function createPeerConnection(targetSocketId) {
    // 2. Crear la conexión RTCPeerConnection
    peerConnection = new RTCPeerConnection(stunServers);

    // 3. Añadir los tracks de audio/video locales a la conexión
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // 4. Escuchar por tracks remotos
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    // 5. Escuchar por candidatos ICE y enviarlos al otro par
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: targetSocketId,
                candidate: event.candidate,
            });
        }
    };
}

// --- Manejo de Eventos de Señalización (Socket.IO) ---

// Un nuevo usuario se une, el iniciador de la llamada crea la oferta
socket.on('user-joined', async (senderId) => {
    console.log('Otro usuario se ha unido:', senderId);
    
    createPeerConnection(senderId);
    
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

    createPeerConnection(payload.sender);
    
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
    await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
});

// Ambos pares reciben los candidatos ICE del otro
socket.on('ice-candidate', async (payload) => {
    if (payload.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
});
