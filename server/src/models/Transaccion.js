const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaccion = sequelize.define('Transaccion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tipo: { type: DataTypes.ENUM('deposito', 'retiro'), allowNull: false },
  monto: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  saldoResultante: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'transacciones' });

module.exports = Transaccion;
