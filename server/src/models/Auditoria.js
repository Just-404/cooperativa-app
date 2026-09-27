const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Auditoria = sequelize.define('Auditoria', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  accion: { type: DataTypes.STRING, allowNull: false },
  entidad: { type: DataTypes.STRING },
  entidadId: { type: DataTypes.STRING },
  detalle: { type: DataTypes.TEXT },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'auditoria', updatedAt: false });

module.exports = Auditoria;
