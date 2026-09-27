const evaluacion = require('../services/evaluacion.service');

async function evaluar(req, res, next) {
  try { res.json(await evaluacion.evaluar(req.params.id, req.body)); } catch (err) { next(err); }
}

module.exports = { evaluar };
