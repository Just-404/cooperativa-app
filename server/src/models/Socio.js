// Modelo Sequelize: Socio
// TODO: definir atributos y asociaciones según el diseño de base de datos
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Socio = sequelize.define('Socio', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
});

module.exports = Socio;
