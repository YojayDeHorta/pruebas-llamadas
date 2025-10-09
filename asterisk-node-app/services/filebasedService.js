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
      await this.updateExtensionsConfig(extension);
      
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
encryption = yes
avpf = yes
icesupport = yes
directmedia = no
transport = ws,wss
force_avp = yes
dtlsenable = yes
dtlsverify = no
dtlscertfile = /etc/asterisk/keys/asterisk.pem
dtlsprivatekey = /etc/asterisk/keys/asterisk.key
dtlssetup = actpass
rtcp_mux = yes
disallow = all
allow = opus
allow = ulaw
allow = alaw
nat = force_rport,comedia
qualify = yes
dtmfmode = rfc2833
insecure = invite,port
callgroup=1         
pickupgroup=1
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
  
  async updateExtensionsConfig(extension) {
    const extensionLine = `exten => ${extension},1,Dial(SIP/${extension},20)\n`;
    
    try {
      const extensionsPath = '/etc/asterisk/extensions.conf';
      
      // Leer archivo actual
      const currentContent = await fs.readFile(extensionsPath, 'utf8');
      
      // Buscar sección [internal]
      const internalIndex = currentContent.indexOf('[internal]');
      if (internalIndex === -1) {
        console.error('No se encontró la sección [internal] en extensions.conf');
        return false;
      }
      
      // Verificar si la extensión ya existe
      if (currentContent.includes(`exten => ${extension},`)) {
        console.log(`La extensión ${extension} ya existe en extensions.conf`);
        return true;
      }
      
      // Dividir contenido
      const beforeInternal = currentContent.substring(0, internalIndex);
      let afterInternal = currentContent.substring(internalIndex);
      
      // Encontrar final de la sección [internal]
      const nextSectionIndex = afterInternal.indexOf('[', 1);
      
      if (nextSectionIndex !== -1) {
        // Hay una sección después de [internal]
        const internalSection = afterInternal.substring(0, nextSectionIndex);
        const restOfFile = afterInternal.substring(nextSectionIndex);
        
        // Insertar extensión al final de la sección [internal]
        const newContent = beforeInternal + internalSection + extensionLine + restOfFile;
        await fs.writeFile(extensionsPath, newContent);
      } else {
        // [internal] es la última sección
        await fs.appendFile(extensionsPath, extensionLine);
      }
      
      console.log(`Extensión ${extension} añadida a extensions.conf`);
      return true;
    } catch (err) {
      console.error('Error actualizando extensions.conf:', err.message);
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