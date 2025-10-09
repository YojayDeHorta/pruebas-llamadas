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
    
    let asteriskUserCreated = false;
    if (asteriskService.amiAvailable) {
      asteriskUserCreated = await asteriskService.createUser(extension, sipPassword);
    } else {
      console.warn(`AMI no disponible o no funcionando correctamente. Usuario SIP ${extension} no creado automáticamente.`);
    }
    res.status(201).json({ 
      message: 'Usuario creado con éxito',
      extension: extension,
      asteriskUserCreated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;