const sociosService = require('../services/socios.service');

// Controlador del módulo: socios
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await sociosService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
