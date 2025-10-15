// seeders/XXXXXXXXXXXXXX-2-initial-roles.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Crear roles
    await queryInterface.bulkInsert('Roles', [
      { name: 'super_admin', description: 'Acceso total al sistema.', createdAt: new Date(), updatedAt: new Date() },
      { name: 'admin', description: 'Acceso administrativo limitado.', createdAt: new Date(), updatedAt: new Date() },
      { name: 'user', description: 'Usuario estándar con permisos básicos.', createdAt: new Date(), updatedAt: new Date() }
    ], {});

    // Obtener los IDs de los roles y permisos recién creados
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Roles";`, { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const permissions = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Permissions";`, { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const roleMap = roles.reduce((map, role) => ({ ...map, [role.name]: role.id }), {});
    const permissionMap = permissions.reduce((map, perm) => ({ ...map, [perm.name]: perm.id }), {});

    // Definir qué permisos tiene cada rol
    const rolePermissions = [
      // Super Admin (todos los permisos)
      { roleId: roleMap.super_admin, permissionId: permissionMap.manage_users },
      { roleId: roleMap.super_admin, permissionId: permissionMap.manage_roles },
      { roleId: roleMap.super_admin, permissionId: permissionMap.make_calls },
      { roleId: roleMap.super_admin, permissionId: permissionMap.view_reports },
      // Admin
      { roleId: roleMap.admin, permissionId: permissionMap.manage_users },
      { roleId: roleMap.admin, permissionId: permissionMap.make_calls },
      { roleId: roleMap.admin, permissionId: permissionMap.view_reports },
      // User
      { roleId: roleMap.user, permissionId: permissionMap.make_calls },
    ];

    // Insertar las asociaciones en la tabla intermedia RolePermissions
    await queryInterface.bulkInsert('RolePermissions', rolePermissions, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
