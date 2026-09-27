const { sequelize, CuentaAhorro, Transaccion } = require('../models');

async function listarPorCuenta(cuentaId) {
  return Transaccion.findAll({ where: { cuentaId }, order: [['fecha', 'DESC']] });
}

async function depositar(cuentaId, monto, usuarioId) {
  if (monto <= 0) {
    const err = new Error('El monto del depósito debe ser mayor a cero');
    err.status = 400;
    throw err;
  }

  return sequelize.transaction(async (t) => {
    const cuenta = await CuentaAhorro.findByPk(cuentaId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!cuenta || cuenta.estado !== 'activa') {
      const err = new Error('Cuenta no encontrada o inactiva');
      err.status = 404;
      throw err;
    }

    const nuevoSaldo = Number(cuenta.saldo) + Number(monto);
    await cuenta.update({ saldo: nuevoSaldo }, { transaction: t });

    return Transaccion.create({
      cuentaId,
      usuarioId,
      tipo: 'deposito',
      monto,
      saldoResultante: nuevoSaldo,
    }, { transaction: t });
  });
}

async function retirar(cuentaId, monto, usuarioId) {
  if (monto <= 0) {
    const err = new Error('El monto del retiro debe ser mayor a cero');
    err.status = 400;
    throw err;
  }

  return sequelize.transaction(async (t) => {
    const cuenta = await CuentaAhorro.findByPk(cuentaId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!cuenta || cuenta.estado !== 'activa') {
      const err = new Error('Cuenta no encontrada o inactiva');
      err.status = 404;
      throw err;
    }

    if (Number(cuenta.saldo) < Number(monto)) {
      const err = new Error('Saldo insuficiente para realizar el retiro');
      err.status = 400;
      throw err;
    }

    const nuevoSaldo = Number(cuenta.saldo) - Number(monto);
    await cuenta.update({ saldo: nuevoSaldo }, { transaction: t });

    return Transaccion.create({
      cuentaId,
      usuarioId,
      tipo: 'retiro',
      monto,
      saldoResultante: nuevoSaldo,
    }, { transaction: t });
  });
}

module.exports = { listarPorCuenta, depositar, retirar };
