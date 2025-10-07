// services/asteriskService.js
const ari = require('ari-client');
const AMI = require('asterisk-ami-client');
const fs = require('fs').promises;
const exec = require('util').promisify(require('child_process').exec);
const config = require('../config/asterisk');

class AsteriskService {
  constructor() {
    this.ariClient = null;
    this.amiClient = null;
  }

  // Conexión a Asterisk REST Interface
  async connect() {
    try {
      const client = await ari.connect(
        config.ari.url, 
        config.ari.username, 
        config.ari.password
      );
      
      this.ariClient = client;
      
      // Conectar a la aplicación Stasis
      client.start('asterisk-node-app');
      
      console.log('Conectado a Asterisk ARI');
      
      // Iniciar AMI
      await this.connectAMI();
      
      return client;
    } catch (err) {
      console.error('Error conectando a Asterisk ARI:', err);
      throw err;
    }
  }
  
  // Conexión a Asterisk Manager Interface
  async connectAMI() {
    try {
      this.amiClient = new AMI({
        reconnect: true,
        host: config.ami.host,
        port: config.ami.port,
        username: config.ami.username,
        password: config.ami.password
      });
      
      await this.amiClient.connect();
      
      console.log('Conectado a Asterisk AMI');
    } catch (err) {
      console.error('Error conectando a Asterisk AMI:', err);
      throw err;
    }
  }
  
  // Iniciar una llamada
  async initiateCall(extension, destination) {
    try {
      // Crear un canal de Asterisk
      const channel = await this.ariClient.channels.originate({
        endpoint: `SIP/${extension}`,
        extension: destination,
        context: 'internal',
        priority: 1,
        callerId: `"${extension}" <${extension}>`
      });
      
      return channel.id;
    } catch (err) {
      console.error('Error iniciando llamada:', err);
      throw err;
    }
  }
  
  // Crear usuario SIP
  async createUser(extension, sipPassword) {
    try {
      // 1. Actualizar archivo sip.conf
      await this.updateSipConfig(extension, sipPassword);
      
      // 2. Actualizar archivo extensions.conf
      await this.updateExtensionsConfig(extension);
      
      // 3. Recargar configuración
      await this.reloadConfiguration();
      
      return true;
    } catch (err) {
      console.error('Error creando usuario SIP:', err);
      throw err;
    }
  }
  
  // Actualizar archivo sip.conf
  async updateSipConfig(extension, password) {
    const sipConfig = `
[${extension}]
type=friend
context=internal
host=dynamic
secret=${password}
nat=force_rport,comedia
directmedia=no
canreinvite=no
qualify=yes
dtmfmode=rfc2833
insecure=invite,port
disallow=all
allow=ulaw
allow=alaw
`;

    // Alternativa: Usar AMI para añadir usuario SIP
    await this.amiClient.action({
      Action: 'UpdateConfig',
      SrcFilename: 'sip.conf',
      DstFilename: 'sip.conf',
      Action_00000: 'NewCat',
      Cat_00000: extension,
      Var_00000: 'type',
      Value_00000: 'friend',
      Var_00001: 'context',
      Value_00001: 'internal',
      // ... más parámetros
    });
  }
  
  // Actualizar archivo extensions.conf
  async updateExtensionsConfig(extension) {
    try {
      // Usando AMI para modificar el plan de marcado
      await this.amiClient.action({
        Action: 'UpdateConfig',
        SrcFilename: 'extensions.conf',
        DstFilename: 'extensions.conf',
        Action_00000: 'Append',
        Cat_00000: 'internal',
        Var_00000: `exten`,
        Value_00000: `${extension},1,Dial(SIP/${extension},20)`,
      });
    } catch (err) {
      console.error('Error actualizando extensions.conf:', err);
      throw err;
    }
  }
  
  // Recargar configuración
  async reloadConfiguration() {
    try {
      // Recargar SIP
      await this.amiClient.action({
        Action: 'Command',
        Command: 'sip reload'
      });
      
      // Recargar plan de marcado
      await this.amiClient.action({
        Action: 'Command',
        Command: 'dialplan reload'
      });
    } catch (err) {
      console.error('Error recargando configuración:', err);
      throw err;
    }
  }
  
  // Responder una llamada entrante
  async answerCall(channelId) {
    try {
      const channel = this.ariClient.channels.get({ channelId });
      await channel.answer();
      return true;
    } catch (err) {
      console.error('Error respondiendo llamada:', err);
      throw err;
    }
  }
  
  // Colgar una llamada
  async hangupCall(channelId) {
    try {
      const channel = this.ariClient.channels.get({ channelId });
      await channel.hangup();
      return true;
    } catch (err) {
      console.error('Error colgando llamada:', err);
      throw err;
    }
  }
  
  // Transferir llamada
  async transferCall(channelId, destination) {
    try {
      const channel = this.ariClient.channels.get({ channelId });
      await channel.redirect({
        endpoint: `SIP/${destination}`
      });
      return true;
    } catch (err) {
      console.error('Error transfiriendo llamada:', err);
      throw err;
    }
  }
  
  // Obtener estado de extensiones
  async getExtensionStatus() {
    try {
      const response = await this.amiClient.action({
        Action: 'SIPpeers'
      });
      
      return response;
    } catch (err) {
      console.error('Error obteniendo estado de extensiones:', err);
      throw err;
    }
  }
  
  // Cerrar conexiones
  async disconnect() {
    if (this.ariClient) {
      this.ariClient.close();
    }
    
    if (this.amiClient) {
      await this.amiClient.disconnect();
    }
  }
}

module.exports = new AsteriskService();