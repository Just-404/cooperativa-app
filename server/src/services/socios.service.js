const { Socio } = require('../models');

async function listar() {
  return Socio.findAll({ order: [['createdAt', 'DESC']] });
}

async function obtener(id) {
  const socio = await Socio.findByPk(id, {
    include: ['cuentas', 'prestamos'],
  });
  if (!socio) {
    const err = new Error('Socio no encontrado');
    err.status = 404;
    throw err;
  }
  return socio;
}

async function crear(datos) {
  return Socio.create(datos);
}

async function actualizar(id, datos) {
  const socio = await obtener(id);
  return socio.update(datos);
}

async function eliminar(id) {
  const socio = await obtener(id);
  await socio.destroy();

  return {
    mensaje: 'Socio eliminado correctamente',
    id: socio.id,
  };
}

async function cambiarEstado(id, estado) {
  const socio = await obtener(id);
  return socio.update({ estado });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, cambiarEstado };
