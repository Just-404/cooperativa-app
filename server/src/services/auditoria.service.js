const { Op } = require('sequelize');
const { Auditoria } = require('../models');

async function registrar({ usuarioId, accion, entidad, entidadId, detalle }) {
  return Auditoria.create({ usuarioId, accion, entidad, entidadId, detalle });
}

async function listar({ accion, entidad, usuarioId, desde, hasta, limit } = {}) {
  const where = {};
  if (accion) where.accion = accion;
  if (entidad) where.entidad = entidad;
  if (usuarioId) where.usuarioId = usuarioId;

  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = new Date(`${desde}T00:00:00`);
    if (hasta) where.fecha[Op.lte] = new Date(`${hasta}T23:59:59.999`);
  }

  return Auditoria.findAll({
    where,
    include: [{ association: 'usuario', attributes: ['id', 'nombre', 'rol'] }],
    order: [['fecha', 'DESC']],
    limit: Math.min(Number(limit) || 200, 500),
  });
}

module.exports = { registrar, listar };
