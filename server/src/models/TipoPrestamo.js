const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TipoPrestamo = sequelize.define('TipoPrestamo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  tasaInteresAnual: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  plazoMaximoMeses: { type: DataTypes.INTEGER, allowNull: false },
  montoMinimo: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  montoMaximo: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
}, { tableName: 'tipos_prestamo' });

module.exports = TipoPrestamo;
