// models/role.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Un rol puede ser asignado a muchos usuarios
      Role.belongsToMany(models.User, { through: 'UserRoles', foreignKey: 'roleId', otherKey: 'userId' });
      // Un rol tiene muchos permisos
      Role.belongsToMany(models.Permission, { through: 'RolePermissions', foreignKey: 'roleId', otherKey: 'permissionId' });
    }
  }
  Role.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Role',
  });
  return Role;
};