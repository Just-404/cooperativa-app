const scoringService = require('../services/scoring.service');

// Controlador del módulo: scoring
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await scoringService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
