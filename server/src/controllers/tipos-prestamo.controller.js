const tipos = require('../services/tipos-prestamo.service');

async function listar(req, res, next) {
  try { res.json(await tipos.listar()); } catch (err) { next(err); }
}
async function crear(req, res, next) {
  try { res.status(201).json(await tipos.crear(req.body)); } catch (err) { next(err); }
}

module.exports = { listar, crear };
