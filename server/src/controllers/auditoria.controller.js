const auditoriaService = require('../services/auditoria.service');

// Controlador del módulo: auditoria
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await auditoriaService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
