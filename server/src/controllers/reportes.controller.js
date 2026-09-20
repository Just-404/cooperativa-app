const reportesService = require('../services/reportes.service');

// Controlador del módulo: reportes
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await reportesService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
