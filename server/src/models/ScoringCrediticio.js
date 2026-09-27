const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ScoringCrediticio = sequelize.define('ScoringCrediticio', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  puntaje: { type: DataTypes.INTEGER, allowNull: false },
  factores: { type: DataTypes.JSON },
  fechaEvaluacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'scoring_crediticio' });

module.exports = ScoringCrediticio;
