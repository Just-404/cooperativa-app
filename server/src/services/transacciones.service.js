const { sequelize, CuentaAhorro, Socio, Transaccion } = require('../models');

async function obtenerCuentaActiva(cuentaId, transaction) {
  const cuentaInicial = await CuentaAhorro.findByPk(cuentaId, { transaction });
  if (!cuentaInicial) {
    const err = new Error('Cuenta no encontrada o inactiva');
    err.status = 404;
    throw err;
  }

  const socio = await Socio.findByPk(cuentaInicial.socioId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!socio || socio.estado !== 'activo') {
    const err = new Error('Cuenta no encontrada o inactiva');
    err.status = 404;
    throw err;
  }

  const cuenta = await CuentaAhorro.findByPk(cuentaId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!cuenta || cuenta.estado !== 'activa') {
    const err = new Error('Cuenta no encontrada o inactiva');
    err.status = 404;
    throw err;
  }
  return cuenta;
}

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
    const cuenta = await obtenerCuentaActiva(cuentaId, t);

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
    const cuenta = await obtenerCuentaActiva(cuentaId, t);

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
