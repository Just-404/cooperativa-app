const usuarios = require('../services/usuarios.service');

async function listar(req, res, next) {
  try { res.json(await usuarios.listar()); } catch (err) { next(err); }
}
async function crear(req, res, next) {
  try { res.status(201).json(await usuarios.crear(req.body)); } catch (err) { next(err); }
}
async function actualizar(req, res, next) {
  try { res.json(await usuarios.actualizar(req.params.id, req.body)); } catch (err) { next(err); }
}
async function cambiarEstado(req, res, next) {
  try { res.json(await usuarios.cambiarEstado(req.params.id, req.body.activo)); } catch (err) { next(err); }
}

module.exports = { listar, crear, actualizar, cambiarEstado };
