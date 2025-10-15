// seeders/XXXXXXXXXXXXXX-3-initial-users.js
'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const saltRounds = 10;
    
    // Crear usuarios
    await queryInterface.bulkInsert('Users', [
      {
        username: 'super_admin',
        password: await bcrypt.hash('Admin789456', saltRounds),
        extension: '1000',
        sipPassword: 'sip_super_admin_secret',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'admin',
        password: await bcrypt.hash('Admin789', saltRounds),
        extension: '1001',
        sipPassword: 'sip_admin_secret',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'test',
        password: await bcrypt.hash('123456789', saltRounds),
        extension: '1002',
        sipPassword: 'sip_test_secret',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Obtener los IDs de los usuarios y roles
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM "Users";`, { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Roles";`, { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const userMap = users.reduce((map, user) => ({ ...map, [user.username]: user.id }), {});
    const roleMap = roles.reduce((map, role) => ({ ...map, [role.name]: role.id }), {});

    // Definir qué rol tiene cada usuario
    const userRoles = [
      { userId: userMap.super_admin, roleId: roleMap.super_admin, createdAt: new Date(), updatedAt: new Date() },
      { userId: userMap.admin, roleId: roleMap.admin, createdAt: new Date(), updatedAt: new Date() },
      { userId: userMap.test, roleId: roleMap.user, createdAt: new Date(), updatedAt: new Date() },
    ];

    // Insertar las asociaciones en la tabla intermedia UserRoles
    await queryInterface.bulkInsert('UserRoles', userRoles, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserRoles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
