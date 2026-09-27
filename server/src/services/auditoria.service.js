const { Auditoria } = require('../models');

async function registrar({ usuarioId, accion, entidad, entidadId, detalle }) {
  return Auditoria.create({ usuarioId, accion, entidad, entidadId, detalle });
}

async function listar() {
  return Auditoria.findAll({
    include: ['usuario'],
    order: [['fecha', 'DESC']],
    limit: 200,
  });
}

module.exports = { registrar, listar };
