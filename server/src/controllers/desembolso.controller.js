const desembolso = require('../services/desembolso.service');

async function desembolsar(req, res, next) {
  try { res.json(await desembolso.desembolsar(req.params.id)); } catch (err) { next(err); }
}

module.exports = { desembolsar };
