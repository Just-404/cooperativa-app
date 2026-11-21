const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cuota = sequelize.define('Cuota', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  numeroCuota: { type: DataTypes.INTEGER, allowNull: false },
  montoCapital: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  montoInteres: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  montoTotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  montoMora: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  // Snapshot de la tasa diaria con que se calculó la mora de esta cuota.
  // Permite que las cuotas ya vencidas conserven su tasa original.
  tasaMoraAplicada: { type: DataTypes.DECIMAL(8, 6), allowNull: true },
  fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.ENUM('pendiente', 'pagada', 'vencida'), defaultValue: 'pendiente' },
}, { tableName: 'cuotas' });

module.exports = Cuota;
