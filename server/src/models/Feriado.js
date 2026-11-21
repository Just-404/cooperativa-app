const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Feriados y fechas no laborables por año. Las filas `oficial` se generan
// automáticamente; las `personalizado` las administra el administrador.
const Feriado = sequelize.define('Feriado', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false }, // fecha observada
  fechaOriginal: { type: DataTypes.DATEONLY, allowNull: true }, // fecha legal original
  origen: {
    type: DataTypes.ENUM('oficial', 'personalizado'),
    allowNull: false,
    defaultValue: 'oficial',
  },
  movible: { type: DataTypes.BOOLEAN, defaultValue: false },
  tipo: { type: DataTypes.STRING(30), allowNull: true }, // fijo | trasladable | movil | personalizado
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'feriados',
  indexes: [{ unique: true, fields: ['anio', 'fecha'] }],
});

module.exports = Feriado;
