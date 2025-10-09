// public/js/sip-client.js (versión JsSIP)
class SipClient {
  constructor(extension, password, server) {
    this.extension = extension;
    this.password = password;
    this.server = server;
    this.ua = null;
    this.session = null;
    this.callbacks = {};
    this.registered = false;
  }

  // Inicializar el cliente SIP
  init() {
    if (typeof JsSIP === 'undefined') {
      console.error('Error: La biblioteca JsSIP no está cargada correctamente');
      return;
    }

    // Activar logs
    JsSIP.debug.enable('JsSIP:*');

    try {
      // Configuración
      //const socket = new JsSIP.WebSocketInterface(`wss://${this.server}:8089/ws`);
      const socket = new JsSIP.WebSocketInterface(`ws://${this.server}:8088/ws`);
      console.log('password:', this.password);
      const configuration = {
        sockets: [socket],
        uri: `sip:${this.extension}@${this.server}`,
        username: this.extension, 
        password: this.password,
        register: true,
        register_expires: 180,
        session_timers: false
      };

      // Crear UA
      this.ua = new JsSIP.UA(configuration);
      
      // Eventos
      this.ua.on('registered', (e) => {
        console.log('SIP registrado con éxito', e);
        this.registered = true;
        if (this.callbacks.onRegistered) {
          this.callbacks.onRegistered();
        }
      });

      this.ua.on('unregistered', (e) => {
        console.log('SIP no registrado', e);
        this.registered = false;
        if (this.callbacks.onUnregistered) {
          this.callbacks.onUnregistered();
        }
      });

      this.ua.on('registrationFailed', (e) => {
        console.error('Falló el registro SIP:', e);
        this.registered = false;
        if (this.callbacks.onRegistrationFailed) {
          this.callbacks.onRegistrationFailed(e);
        }
      });

      // Manejar llamadas entrantes
      this.ua.on('newRTCSession', (data) => {
        const session = data.session;
        
        if (session.direction === 'incoming') {
          console.log('Llamada entrante', session);
          this.session = session;
          
          if (this.callbacks.onIncomingCall) {
            const callerId = session.remote_identity.display_name || 
                             session.remote_identity.uri.user;
            this.callbacks.onIncomingCall(callerId, session);
          }
          
          session.on('accepted', () => {
            console.log('Llamada aceptada');
            if (this.callbacks.onCallAccepted) {
              this.callbacks.onCallAccepted(session);
            }
          });
          
          session.on('ended', () => {
            console.log('Llamada finalizada');
            this.session = null;
            if (this.callbacks.onCallEnded) {
              this.callbacks.onCallEnded(session);
            }
          });
          
          session.on('failed', () => {
            console.log('Llamada fallida');
            this.session = null;
            if (this.callbacks.onCallEnded) {
              this.callbacks.onCallEnded(session);
            }
          });
        }
      });
      
      // Iniciar UA
      this.ua.start();
      
      console.log('Cliente SIP inicializado');
    } catch (error) {
      console.error('Error al inicializar SIP:', error);
    }
  }

  // Realizar una llamada
  call(destination) {
    if (!this.ua || !this.registered) {
      console.error('Cliente SIP no registrado');
      return false;
    }

    try {
      // Opciones para la llamada
      const options = {
        mediaConstraints: {
          audio: true,
          video: false
        }
      };
      
      // Iniciar llamada
      this.session = this.ua.call(`sip:${destination}@${this.server}`, options);
      
      // Configurar eventos
      this.session.on('confirmed', () => {
        console.log('Llamada confirmada');
        if (this.callbacks.onCallAccepted) {
          this.callbacks.onCallAccepted(this.session);
        }
      });
      
      this.session.on('ended', () => {
        console.log('Llamada finalizada');
        this.session = null;
        if (this.callbacks.onCallEnded) {
          this.callbacks.onCallEnded(this.session);
        }
      });
      
      this.session.on('failed', () => {
        console.log('Llamada fallida');
        this.session = null;
        if (this.callbacks.onCallEnded) {
          this.callbacks.onCallEnded(this.session);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error al realizar llamada:', error);
      return false;
    }
  }

  // Contestar una llamada
  answer() {
    if (this.session) {
      const options = {
        mediaConstraints: {
          audio: true,
          video: false
        }
      };
      this.session.answer(options);
    }
  }

  // Colgar una llamada
  hangup() {
    if (this.session) {
      this.session.terminate();
      this.session = null;
    }
  }

  // Registrar callbacks
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  // Finalizar cliente SIP
  terminate() {
    if (this.ua) {
      this.ua.stop();
      this.ua = null;
    }
  }
}