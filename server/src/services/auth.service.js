const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const env = require('../config/env');

async function login(email, passwordPlano) {
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const esValido = await usuario.compararPassword(passwordPlano);
  if (!esValido) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  if (!usuario.activo) {
    const err = new Error('El usuario está desactivado');
    err.status = 403;
    throw err;
  }

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return { token, usuario };
}

module.exports = { login };
