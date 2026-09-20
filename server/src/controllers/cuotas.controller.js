const cuotasService = require('../services/cuotas.service');

// Controlador del módulo: cuotas
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await cuotasService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
