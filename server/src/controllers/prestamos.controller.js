const prestamosService = require('../services/prestamos.service');

// Controlador del módulo: prestamos
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await prestamosService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
