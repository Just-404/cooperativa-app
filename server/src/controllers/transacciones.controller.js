const transacciones = require('../services/transacciones.service');

async function listarPorCuenta(req, res, next) {
  try { res.json(await transacciones.listarPorCuenta(req.params.cuentaId)); } catch (err) { next(err); }
}
async function depositar(req, res, next) {
  try {
    const { cuentaId, monto } = req.body;
    res.status(201).json(await transacciones.depositar(cuentaId, monto, req.user.id));
  } catch (err) { next(err); }
}
async function retirar(req, res, next) {
  try {
    const { cuentaId, monto } = req.body;
    res.status(201).json(await transacciones.retirar(cuentaId, monto, req.user.id));
  } catch (err) { next(err); }
}

module.exports = { listarPorCuenta, depositar, retirar };
