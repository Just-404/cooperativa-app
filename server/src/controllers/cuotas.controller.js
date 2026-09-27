const cuotas = require('../services/cuotas.service');

async function listarPorPrestamo(req, res, next) {
  try { res.json(await cuotas.listarPorPrestamo(req.params.prestamoId)); } catch (err) { next(err); }
}

module.exports = { listarPorPrestamo };
