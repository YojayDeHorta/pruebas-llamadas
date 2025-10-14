const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class FileBasedService {
  async createUser(extension, password) {
    try {
      console.log(`Creando usuario SIP ${extension} mediante manipulación directa de archivos`);
      
      // Actualizar archivos
      await this.updateSipConfig(extension, password);
      await this.updateQueueConfig(extension);
      
      // Recargar configuración
      await this.reloadConfig();
      
      return true;
    } catch (err) {
      console.error(`Error creando usuario SIP ${extension}:`, err.message);
      return false;
    }
  }
  
  async updateSipConfig(extension, password) {
    const sipConfig = `
[${extension}]
type=friend
context=internal
host=dynamic
secret=${password}
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
`;

    try {
      const sipPath = '/etc/asterisk/sip.conf';
      
      // Leer archivo actual
      const currentContent = await fs.readFile(sipPath, 'utf8');
      
      // Verificar si la extensión ya existe
      if (currentContent.includes(`[${extension}]`)) {
        console.log(`La extensión ${extension} ya existe en sip.conf`);
        return true;
      }
      
      // Añadir nueva configuración al final
      await fs.appendFile(sipPath, sipConfig);
      console.log(`Extensión ${extension} añadida a sip.conf`);
      
      return true;
    } catch (err) {
      console.error('Error actualizando sip.conf:', err.message);
      throw err;
    }
  }

  async updateQueueConfig(extension) {
    const queueConfig = `member => SIP/${extension}\n`;

    try {
      const queuePath = '/etc/asterisk/queues.conf';
      
      // Leer archivo actual
      const currentContent = await fs.readFile(queuePath, 'utf8');
      
      // Verificar si la extensión ya es miembro
      if (currentContent.includes(`member => SIP/${extension}`)) {
        console.log(`La extensión ${extension} ya es miembro en queues.conf`);
        return true;
      }
      
      // Añadir nueva configuración al final
      await fs.appendFile(queuePath, queueConfig);
      console.log(`Extensión ${extension} añadida a queues.conf`);
      
      return true;
    } catch (err) {
      console.error('Error actualizando queue.conf:', err.message);
      throw err;
    }
  }
  
  async reloadConfig() {
    try {
      // Recargar SIP
      await execPromise('sudo asterisk -rx "sip reload"');
      console.log('Configuración SIP recargada');
      
      // Recargar dialplan
      await execPromise('sudo asterisk -rx "dialplan reload"');
      console.log('Plan de marcado recargado');
      
      // Recargar colas
      await execPromise('sudo asterisk -rx "queue reload members"');
      console.log('Colas recargadas');

      return true;
    } catch (err) {
      console.error('Error recargando configuración:', err.message);
      // No lanzamos el error para que el resto del proceso pueda continuar
      return false;
    }
  }
  
  // Para la interfaz con calls.js
  async initiateCall(extension, destination) {
    try {
      // Usa el contexto 'internal' explícitamente
      const result = await execPromise(`sudo asterisk -rx "channel originate SIP/${extension} extension ${destination}@internal"`);
      console.log('Llamada iniciada:', result);
      
      // Generar un ID único para la llamada
      const callId = 'call-' + Date.now();
      return callId;
    } catch (err) {
      console.error('Error iniciando llamada:', err.message);
      throw err;
    }
  }
}

module.exports = new FileBasedService();