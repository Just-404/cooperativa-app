const scoring = require('../services/scoring.service');

async function obtenerPorSocio(req, res, next) {
  try { res.json(await scoring.obtenerPorSocio(req.params.socioId)); } catch (err) { next(err); }
}
async function calcular(req, res, next) {
  try { res.status(201).json(await scoring.calcular(req.params.socioId)); } catch (err) { next(err); }
}

module.exports = { obtenerPorSocio, calcular };
