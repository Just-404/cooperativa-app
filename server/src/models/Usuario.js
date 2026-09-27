const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  rol: {
    type: DataTypes.ENUM('administrador', 'cajero', 'oficial_credito', 'gerente', 'auditor'),
    allowNull: false,
  },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'usuarios',
  hooks: {
    beforeCreate: async (usuario) => {
      usuario.password = await bcrypt.hash(usuario.password, 10);
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
  },
});

Usuario.prototype.compararPassword = function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

Usuario.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Usuario;
