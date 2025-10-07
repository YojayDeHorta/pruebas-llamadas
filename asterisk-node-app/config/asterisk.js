// config/asterisk.js
module.exports = {
  ari: {
    url: process.env.ASTERISK_ARI_URL || 'http://localhost:8088',
    username: process.env.ASTERISK_ARI_USERNAME || 'asterisk',
    password: process.env.ASTERISK_ARI_PASSWORD || 'asterisk'
  },
  ami: {
    host: process.env.ASTERISK_AMI_HOST || 'localhost',
    port: process.env.ASTERISK_AMI_PORT || 5038,
    username: process.env.ASTERISK_AMI_USERNAME || 'admin',
    password: process.env.ASTERISK_AMI_PASSWORD || 'admin'
  }
};