const socios = require('../services/socios.service');

async function listar(req, res, next) {
  try { res.json(await socios.listar()); } catch (err) { next(err); }
}
async function obtener(req, res, next) {
  try { res.json(await socios.obtener(req.params.id)); } catch (err) { next(err); }
}
async function crear(req, res, next) {
  try { res.status(201).json(await socios.crear(req.body)); } catch (err) { next(err); }
}
async function actualizar(req, res, next) {
  try { res.json(await socios.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}
async function eliminar(req, res, next) {
  try {
    const resultado = await socios.eliminar(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}
async function cambiarEstado(req, res, next) {
  try { res.json(await socios.cambiarEstado(req.params.id, req.body.estado)); } catch (err) { next(err); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, cambiarEstado };
