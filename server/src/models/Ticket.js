const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID del usuario que reporta (puede ser null si es del admin)'
  },
  tipo: {
    type: DataTypes.ENUM('forgot_password', 'report_problem'),
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pending', 'resolved', 'cancelled'),
    defaultValue: 'pending',
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fechaResolucion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  usuarioAdmin: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID del administrador que resolvió el ticket'
  },
}, { tableName: 'tickets' });

module.exports = Ticket;