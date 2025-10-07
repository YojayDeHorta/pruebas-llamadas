const express = require('express');
const path = require('path');

const app = express();
// Reemplaza bodyParser con los middlewares integrados de Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const callRoutes = require('./routes/calls');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calls', callRoutes);

module.exports = app;