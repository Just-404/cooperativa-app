const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pago = sequelize.define('Pago', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  monto: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  moraCobrada: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  fechaPago: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'pagos' });

module.exports = Pago;
