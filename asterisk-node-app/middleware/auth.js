// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  // Obtener token del header
  const token = req.header('x-auth-token');
  
  // Verificar si no hay token
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token' });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en la base de datos
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Añadir el usuario a la solicitud
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};