const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Prestamo = sequelize.define('Prestamo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  montoSolicitado: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
  montoAprobado: { type: DataTypes.DECIMAL(14, 2) },
  plazoMeses: { type: DataTypes.INTEGER, allowNull: false },
  tasaInteresAnual: { type: DataTypes.DECIMAL(5, 2) },
  estado: {
    type: DataTypes.ENUM(
      'solicitado', 'en_evaluacion', 'evaluado',
      'aprobado', 'rechazado', 'desembolsado', 'cerrado'
    ),
    defaultValue: 'solicitado',
  },
  comentarioEvaluacion: { type: DataTypes.TEXT },
  comentarioAprobacion: { type: DataTypes.TEXT },
  fechaSolicitud: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fechaEvaluacion: { type: DataTypes.DATE },
  fechaAprobacion: { type: DataTypes.DATE },
  fechaDesembolso: { type: DataTypes.DATE },
}, { tableName: 'prestamos' });

module.exports = Prestamo;
