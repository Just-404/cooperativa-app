const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Historial de tasas de mora. Es append-only: nunca se editan tasas anteriores.
const TasaMora = sequelize.define('TasaMora', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tasaDiaria: { type: DataTypes.DECIMAL(8, 6), allowNull: false },
  vigenteDesde: { type: DataTypes.DATEONLY, allowNull: false },
  creadoPorId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'tasas_mora',
  indexes: [{ unique: true, fields: ['vigenteDesde'] }],
});

module.exports = TasaMora;
