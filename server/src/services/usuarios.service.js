const { Usuario } = require('../models');

async function listar() {
  return Usuario.findAll({ order: [['createdAt', 'DESC']] });
}

async function crear(datos) {
  return Usuario.create(datos);
}

async function actualizar(id, datos) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return usuario.update(datos);
}

async function cambiarEstado(id, activo) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return usuario.update({ activo });
}

module.exports = { listar, crear, actualizar, cambiarEstado };
