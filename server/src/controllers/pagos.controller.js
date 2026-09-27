const pagos = require('../services/pagos.service');

async function listarEnMora(req, res, next) {
  try { res.json(await pagos.listarEnMora()); } catch (err) { next(err); }
}
async function registrar(req, res, next) {
  try {
    const { cuotaId, monto } = req.body;
    res.status(201).json(await pagos.registrarPago(cuotaId, monto, req.user.id));
  } catch (err) { next(err); }
}
async function calcularMora(req, res, next) {
  try { res.json(await pagos.calcularMora()); } catch (err) { next(err); }
}

module.exports = { listarEnMora, registrar, calcularMora };
