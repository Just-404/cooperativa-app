const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Socio = sequelize.define('Socio', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  documento: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING },
  telefono: { type: DataTypes.STRING },
  direccion: { type: DataTypes.STRING },
  fechaNacimiento: { type: DataTypes.DATEONLY },
  fechaIngreso: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('activo', 'inactivo'), defaultValue: 'activo' },
}, { tableName: 'socios' });

module.exports = Socio;
