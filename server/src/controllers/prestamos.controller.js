const prestamos = require('../services/prestamos.service');

async function listar(req, res, next) {
  try { res.json(await prestamos.listar()); } catch (err) { next(err); }
}
async function obtener(req, res, next) {
  try { res.json(await prestamos.obtener(req.params.id)); } catch (err) { next(err); }
}
async function solicitar(req, res, next) {
  try { res.status(201).json(await prestamos.solicitar(req.body)); } catch (err) { next(err); }
}

module.exports = { listar, obtener, solicitar };
