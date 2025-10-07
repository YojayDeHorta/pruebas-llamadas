// routes/users.js
const router = require('express').Router();
const { User } = require('../models');
const asteriskService = require('../services/asteriskService');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const extension = generateExtension();
    const sipPassword = generatePassword();
    
    // Crear usuario con Sequelize
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      extension: extension,
      sipPassword: sipPassword
    });
    
    // Crear en Asterisk
    await asteriskService.createUser(extension, sipPassword);
    
    res.status(201).json({ 
      message: 'Usuario creado con éxito',
      extension: extension
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;