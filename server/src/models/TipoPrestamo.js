// Modelo Sequelize: TipoPrestamo
// TODO: definir atributos y asociaciones según el diseño de base de datos
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TipoPrestamo = sequelize.define('TipoPrestamo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
});

module.exports = TipoPrestamo;
