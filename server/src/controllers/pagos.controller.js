const pagosService = require('../services/pagos.service');

// Controlador del módulo: pagos
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await pagosService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
