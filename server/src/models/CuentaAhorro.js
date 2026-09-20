// Modelo Sequelize: CuentaAhorro
// TODO: definir atributos y asociaciones según el diseño de base de datos
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CuentaAhorro = sequelize.define('CuentaAhorro', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
});

module.exports = CuentaAhorro;
