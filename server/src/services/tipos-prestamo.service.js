const { TipoPrestamo } = require('../models');

async function listar() {
  return TipoPrestamo.findAll({ order: [['nombre', 'ASC']] });
}

async function crear(datos) {
  return TipoPrestamo.create(datos);
}

module.exports = { listar, crear };
