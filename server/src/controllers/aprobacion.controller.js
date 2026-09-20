const aprobacionService = require('../services/aprobacion.service');

// Controlador del módulo: aprobacion
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await aprobacionService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
