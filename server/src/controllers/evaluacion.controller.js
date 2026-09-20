const evaluacionService = require('../services/evaluacion.service');

// Controlador del módulo: evaluacion
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await evaluacionService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
