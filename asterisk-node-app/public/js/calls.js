window.addEventListener('load', () => {
  if (typeof JsSIP === 'undefined') {
    console.error('ERROR: La biblioteca JsSIP no está disponible');
    alert('Error: No se pudo cargar la biblioteca JsSIP. Por favor, recargue la página.');
  } else {
    console.log('JsSIP v' + JsSIP.version + ' cargado correctamente');
  }
});
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || !user) {
    window.location.href = '/login.html';
    return;
  }

  // Referencias a elementos del DOM
  const callBtn = document.getElementById('call-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userExtension = document.getElementById('user-extension');
  const callNotification = document.getElementById('call-notification');
  const callerId = document.getElementById('caller-id');
  const answerBtn = document.getElementById('answer-btn');
  const rejectBtn = document.getElementById('reject-btn');
  const destinationInput = document.getElementById('destination');
  const activeList = document.getElementById('active-list');
  const incomingList = document.getElementById('incoming-list');

  // Mostrar extensión del usuario
  userExtension.textContent = `Extensión: ${user.extension}`;

  // Inicializar cliente SIP
  const sipClient = new SipClient(
    user.extension, 
    user.sipPassword,
    window.location.hostname
  );

  // Conectar con WebSocket
  const socket = io({
    query: {
      userId: user.id
    },
    auth: {
      token
    }
  });

  // Eventos WebSocket
  socket.on('connect', () => {
    console.log('Conectado al servidor WebSocket');
    socket.emit('register', { userId: user.id });
  });

  socket.on('incomingCall', (data) => {
    showCallNotification(data.callerId);
  });

  socket.on('callStatus', (data) => {
    updateCallStatus(data);
  });

  // Eventos SIP
  sipClient.on('onRegistered', () => {
    console.log('Registrado en servidor SIP');
  });

  sipClient.on('onRegistrationFailed', (e) => {
    console.error('Error al registrarse en servidor SIP:', e);
  });

  sipClient.on('onIncomingCall', (callerId, session) => {
    showCallNotification(callerId);
  });

  sipClient.on('onCallAccepted', (session) => {
    callNotification.style.display = 'none';
    addActiveCall(session);
  });

  sipClient.on('onCallEnded', (session) => {
    removeActiveCall(session);
  });

  // Iniciar cliente SIP
  sipClient.init();

  // Evento: Realizar llamada
  callBtn.addEventListener('click', () => {
    const destination = destinationInput.value.trim();
    if (!destination) {
      alert('Por favor, ingrese un número de destino');
      return;
    }
    
    // Llamada a través de backend
    fetch('/api/calls/outbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ destination })
    })
    .then(response => {
      if (!response.ok) throw new Error('Error al iniciar llamada');
      return response.json();
    })
    .then(data => {
      console.log('Llamada iniciada:', data.callId);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error al iniciar la llamada');
    });
  });

  // Evento: Contestar llamada
  answerBtn.addEventListener('click', () => {
    sipClient.answer();
    callNotification.style.display = 'none';
  });

  // Evento: Rechazar llamada
  rejectBtn.addEventListener('click', () => {
    sipClient.hangup();
    callNotification.style.display = 'none';
  });

  // Evento: Cerrar sesión
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sipClient.terminate();
    window.location.href = '/login.html';
  });

  // Función: Mostrar notificación de llamada entrante
  function showCallNotification(id) {
    callerId.textContent = id;
    callNotification.style.display = 'flex';
  }

  // Función: Actualizar estado de llamada
  function updateCallStatus(data) {
    // Implementar lógica de actualización
  }

  // Función: Añadir llamada activa
  function addActiveCall(session) {
    const callItem = document.createElement('div');
    callItem.className = 'call-item';
    callItem.dataset.id = session.id;

    const callInfo = document.createElement('div');
    callInfo.className = 'call-info';
    callInfo.textContent = session.remoteIdentity.uri.user;

    const hangupBtn = document.createElement('button');
    hangupBtn.className = 'btn btn-small btn-danger';
    hangupBtn.textContent = 'Colgar';
    hangupBtn.addEventListener('click', () => {
      sipClient.hangup();
    });

    callItem.appendChild(callInfo);
    callItem.appendChild(hangupBtn);
    activeList.appendChild(callItem);
  }

  // Función: Eliminar llamada activa
  function removeActiveCall(session) {
    const callItem = activeList.querySelector(`[data-id="${session.id}"]`);
    if (callItem) {
      activeList.removeChild(callItem);
    }
  }
});