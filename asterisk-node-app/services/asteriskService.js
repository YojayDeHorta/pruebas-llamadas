// services/asteriskService.js - Versión modificada
const ari = require('ari-client');
const AMI = require('asterisk-ami-client');
const config = require('../config/asterisk');

class AsteriskService {
  constructor() {
    this.ariClient = null;
    this.amiClient = null;
    this.amiAvailable = false;
  }

  async connect() {
    try {
      const client = await ari.connect(
        config.ari.url, 
        config.ari.username, 
        config.ari.password
      );
      
      this.ariClient = client;
      client.start('asterisk-node-app');
      console.log('Conectado a Asterisk ARI');
      
      // Intentar conectar a AMI pero continuar si falla
      try {
        await this.connectAMI();
      } catch (amiError) {
        console.warn('AMI no disponible. Algunas funciones estarán limitadas:', amiError.message);
      }
      
      return client;
    } catch (err) {
      console.error('Error conectando a Asterisk ARI:', err);
      throw err;
    }
  }
  
  // services/asteriskService.js - AMI connection part
  async connectAMI() {
    try {
      this.amiClient = new AMI({
        reconnect: true,
        reconnectTimeout: 5000,
        maxAttemptsCount: 5,
        keepAlive: true
      });
      
      await this.amiClient.connect(config.ami.username, config.ami.password, {host: config.ami.host, port: config.ami.port});
      this.amiAvailable = true;
      console.log('Conectado a Asterisk AMI');
    } catch (err) {
      this.amiAvailable = false;
      console.error('AMI Connection error:', err.message);
      throw err;
    }
  }
  
  // Modificar métodos que usan AMI para verificar disponibilidad
  async updateSipConfig(extension, password) {
    if (!this.amiAvailable) {
      console.warn(`AMI no disponible. No se puede actualizar SIP para extensión ${extension}`);
      return false;
    }
    
    try {
      console.log(`Actualizando sip.conf para extensión ${extension}`);
      // Alternativa: Usar AMI para añadir usuario SIP
      await this.amiClient.action({
        Action: 'UpdateConfig',
        SrcFilename: 'sip.conf',
        DstFilename: 'sip.conf',
        Reload: 'yes',
        Action_000000: 'newcat',
        Cat_000000: extension,
        Var_000001: 'type',
        Value_000001: 'friend',
        Var_000002: 'context',
        Value_000002: 'internal',
        Var_000003: 'host',
        Value_000003: 'dynamic',
        Var_000004: 'secret',
        Value_000004: password,
        Var_000005: 'nat',
        Value_000005: 'force_rport,comedia',
        Var_000006: 'directmedia',
        Value_000006: 'no',
        Var_000007: 'disallow',
        Value_000007: 'all',
        Var_000008: 'allow',
        Value_000008: 'ulaw,alaw',
        Var_000009: 'dtmfmode',
        Value_000009: 'rfc2833',
        Var_000010: 'qualify',
        Value_000010: 'yes'
      });
      
      return true;
    } catch (err) {
      console.error('Error actualizando sip.conf:', err);
      return false;
    }
  }
  
  async createUser(extension, password) {
    try {
      if (!this.amiAvailable) {
        console.warn(`AMI no disponible. Usuario SIP ${extension} no creado.`);
        return false;
      }
      
      // Actualizar archivo sip.conf usando AMI
      await this.updateSipConfig(extension, password);
      
      // Actualizar archivo extensions.conf
      await this.updateExtensionsConfig(extension);
      
      // Recargar configuración
      await this.reloadConfiguration();
      
      console.log(`Usuario SIP ${extension} creado exitosamente`);
      return true;
    } catch (err) {
      console.error('Error creando usuario SIP:', err);
      return false;
    }
  }

  // Implementar método para actualizar extensions.conf
  async updateExtensionsConfig(extension) {
    console.log(`Actualizando extensions.conf para extensión ${extension}`);
    if (!this.amiAvailable) {
      return false;
    }
    
    try {
      // Usando AMI para modificar el plan de marcado
      await this.amiClient.action({
        Action: 'UpdateConfig',
        SrcFilename: 'extensions.conf',
        DstFilename: 'extensions.conf',
        Reload: 'yes',
        Action_000000: 'append',
        Cat_000000: 'internal',
        Var_000000: 'exten',
        Value_000000: `${extension},1,Dial(SIP/${extension},20)`
      });
      
      return true;
    } catch (err) {
      console.error('Error actualizando extensions.conf:', err);
      return false;
    }
  }

  // Implementar método para recargar configuración
  async reloadConfiguration() {
    if (!this.amiAvailable) {
      return false;
    }
    console.log(`Recargando configuración...`);
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
      
      return true;
    } catch (err) {
      console.error('Error recargando configuración:', err);
      return false;
    }
  }

}

module.exports = new AsteriskService();