const cuentas = require('../services/cuentas.service');

async function listar(req, res, next) {
  try { res.json(await cuentas.listar(req.user.rol)); } catch (err) { next(err); }
}
async function listarPorSocio(req, res, next) {
  try { res.json(await cuentas.listarPorSocio(req.params.socioId, req.user.rol)); } catch (err) { next(err); }
}
async function obtener(req, res, next) {
  try { res.json(await cuentas.obtener(req.params.id, req.user.rol)); } catch (err) { next(err); }
}
async function abrir(req, res, next) {
  try {
    const { socioId, saldoInicial } = req.body;

    res.status(201).json(await cuentas.abrir(socioId, saldoInicial));
  } catch (err) { next(err); }
}

async function cerrarCuenta(req, res, next){
  try {
    const {cuentaId} = req.params; 
    res.json(await cuentas.cerrarCuenta(cuentaId));
  } catch (err) { next(err) }
}

async function cambiarEstado(req, res, next) {
  try {
    res.json(await cuentas.cambiarEstado(req.params.id, req.body.estado));
  } catch (err) { next(err); }
}

module.exports = { listar, listarPorSocio, obtener, abrir, cerrarCuenta, cambiarEstado };
