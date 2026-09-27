const aprobacion = require('../services/aprobacion.service');

async function aprobar(req, res, next) {
  try { res.json(await aprobacion.aprobar(req.params.id, req.body, req.user.id)); } catch (err) { next(err); }
}
async function rechazar(req, res, next) {
  try { res.json(await aprobacion.rechazar(req.params.id, req.body, req.user.id)); } catch (err) { next(err); }
}

module.exports = { aprobar, rechazar };
