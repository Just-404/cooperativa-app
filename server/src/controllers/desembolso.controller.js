const desembolsoService = require('../services/desembolso.service');

// Controlador del módulo: desembolso
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await desembolsoService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
