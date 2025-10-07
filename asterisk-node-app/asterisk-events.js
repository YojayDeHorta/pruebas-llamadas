const { User } = require('./models');

function setupAsteriskEvents(client, io) {
  client.on('StasisStart', async (event, channel) => {
    const callerId = channel.caller.number;
    const extension = channel.dialplan.exten;
    
    const user = await User.findOne({ where: { extension } });
    
    if (user) {
      io.to(`user:${user.id}`).emit('incomingCall', {
        callerId,
        channelId: channel.id
      });
    }
    
    // Manejar llamadas entrantes
    channel.answer();
    
    // Eventos adicionales del canal
    channel.on('StasisEnd', () => {
      if (user) {
        io.to(`user:${user.id}`).emit('callEnded', { channelId: channel.id });
      }
    });
  });
  
  // Más eventos Asterisk
  client.on('ChannelStateChange', (event, channel) => {
    // Notificar cambios de estado
  });
}

module.exports = setupAsteriskEvents;