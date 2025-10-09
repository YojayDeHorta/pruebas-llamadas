// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auth = require('../middleware/auth');
const fileBasedService = require('../services/filebasedService');

// Función para generar extensión única
const generateExtension = async () => {
  // Generar número entre 1000-9999
  let extension = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Verificar si ya existe
  let existingUser = await User.findOne({ where: { extension } });
  
  // Si existe, generar otro
  while (existingUser) {
    extension = Math.floor(1000 + Math.random() * 9000).toString();
    existingUser = await User.findOne({ where: { extension } });
  }
  
  return extension;
};

// Función para generar contraseña SIP
const generateSipPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};

// Ruta: POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validación básica
    if (!username || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    
    // Verificar si usuario ya existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuario ya existe' });
    }
    
    // Generar extensión y contraseña SIP
    const extension = await generateExtension();
    const sipPassword = generateSipPassword();
    
    // Crear usuario en base de datos
    const user = await User.create({
      username,
      password: password,
      extension,
      sipPassword,
      active: true
    });
    
    let asteriskUserCreated = false;
    try {
      asteriskUserCreated = await fileBasedService.createUser(extension, sipPassword);
    } catch (asteriskError) {
      console.warn(`Error al crear extensión ${extension}:`, asteriskError.message);
    }
    
    res.status(201).json({ 
      message: 'Usuario registrado correctamente', 
      extension 
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validación básica
    if (!username || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    
    // Buscar usuario
    const user = await User.findOne({ where: { username } });
    // Verificar si existe y contraseña válida
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Verificar si usuario está activo
    if (!user.active) {
      return res.status(401).json({ message: 'Usuario desactivado' });
    }
    
    // Crear token JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Devolver token y datos de usuario
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        extension: user.extension,
        sipPassword: user.sipPassword
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta: GET /api/auth/me - Obtener perfil de usuario
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      extension: req.user.extension,
      sipPassword: req.user.sipPassword
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;