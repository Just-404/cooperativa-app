const auditoria = require('../services/auditoria.service');

async function listar(req, res, next) {
  try { res.json(await auditoria.listar()); } catch (err) { next(err); }
}

module.exports = { listar };
