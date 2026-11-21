const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Configuración global de la cooperativa. Existe una sola fila (id = 1).
const Configuracion = sequelize.define('Configuracion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false, defaultValue: 1 },
  diasNoLaborables: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [0, 6], // 0=domingo ... 6=sábado
  },
  calendarioDesactualizado: { type: DataTypes.BOOLEAN, defaultValue: false },
  actualizadoPorId: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'configuracion', timestamps: true });

module.exports = Configuracion;
