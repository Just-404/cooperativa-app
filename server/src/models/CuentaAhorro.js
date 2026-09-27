const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CuentaAhorro = sequelize.define('CuentaAhorro', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  numeroCuenta: { type: DataTypes.STRING, allowNull: false, unique: true },
  saldo: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  estado: { type: DataTypes.ENUM('activa', 'cerrada'), defaultValue: 'activa' },
  fechaApertura: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
}, { tableName: 'cuentas_ahorro' });

module.exports = CuentaAhorro;
