// seeders/XXXXXXXXXXXXXX-1-initial-permissions.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Permissions', [
      {
        name: 'manage_users',
        description: 'Permite crear, editar y eliminar usuarios.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'manage_roles',
        description: 'Permite gestionar roles y sus permisos.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'make_calls',
        description: 'Permite realizar llamadas salientes.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'view_reports',
        description: 'Permite ver reportes de llamadas.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', null, {});
  }
};
