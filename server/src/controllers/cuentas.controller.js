const cuentas = require('../services/cuentas.service');

async function listar(req, res, next) {
  try { res.json(await cuentas.listar()); } catch (err) { next(err); }
}
async function listarPorSocio(req, res, next) {
  try { res.json(await cuentas.listarPorSocio(req.params.socioId)); } catch (err) { next(err); }
}
async function obtener(req, res, next) {
  try { res.json(await cuentas.obtener(req.params.id)); } catch (err) { next(err); }
}
async function abrir(req, res, next) {
  try {
    const { socioId, saldoInicial } = req.body;
    res.status(201).json(await cuentas.abrir(socioId, saldoInicial));
  } catch (err) { next(err); }
}

module.exports = { listar, listarPorSocio, obtener, abrir };
