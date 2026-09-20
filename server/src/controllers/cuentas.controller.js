const cuentasService = require('../services/cuentas.service');

// Controlador del módulo: cuentas
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await cuentasService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
