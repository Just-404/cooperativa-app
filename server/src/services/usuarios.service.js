const { Usuario } = require('../models');

async function listar() {
  return Usuario.findAll({ order: [['createdAt', 'DESC']] });
}

async function crear(datos) {
  return Usuario.create(datos);
}

async function actualizar(id, datos, usuarioActualId) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  if (!usuario.activo) {
    const err = new Error('No se puede editar un usuario desactivado. Actívalo primero.');
    err.status = 409;
    throw err;
  }
  if (id === usuarioActualId && usuario.rol === 'administrador' && datos.rol !== usuario.rol) {
    const err = new Error('No puedes cambiar el rol de tu propio usuario administrador.');
    err.status = 400;
    throw err;
  }
  const cambios = {
    nombre: datos.nombre,
    email: datos.email,
    rol: datos.rol,
  };
  if (datos.password) cambios.password = datos.password;
  return usuario.update(cambios);
}

async function cambiarEstado(id, activo, usuarioActualId) {
  if (!activo && id === usuarioActualId) {
    const err = new Error('No puedes desactivar tu propio usuario');
    err.status = 400;
    throw err;
  }

  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return usuario.update({ activo });
}

module.exports = { listar, crear, actualizar, cambiarEstado };
