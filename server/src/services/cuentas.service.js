const { CuentaAhorro, Socio, sequelize } = require('../models');

function generarNumeroCuenta() {
  return 'CTA-' + Date.now().toString().slice(-8);
}

async function listar(rol) {
  const where = rol === 'cajero'
    ? { estado: ['activa', 'inactiva'] }
    : undefined;
  return CuentaAhorro.findAll({ where, include: ['socio'], order: [['createdAt', 'DESC']] });
}

async function cerrarCuenta(cuenta) {
  const id = cuenta && typeof cuenta === 'object' ? cuenta.id : cuenta;

   return sequelize.transaction(async (t) => {
      const actual = await CuentaAhorro.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
  
      if (!actual) {
        const err = new Error('Cuenta no encontrada');
        err.status = 404;
        throw err;
      }
  
      if (actual.estado === 'cerrada') {
        const err = new Error('La cuenta ya está cerrada');
        err.status = 400;
        throw err;
      }

      if (actual.estado !== 'inactiva') {
        const err = new Error('Solo se pueden cerrar cuentas desactivadas');
        err.status = 400;
        throw err;
      }
  
      // Se compara en centavos para evitar residuos de punto flotante (0.1 + 0.2)
      if (Math.round(Number(actual.saldo) * 100) !== 0) {
        const err = new Error(
          `No se puede cerrar una cuenta con saldo (RD$ ${Number(actual.saldo).toLocaleString()}). Retira el saldo primero.`
        );
        err.status = 400;
        throw err;
      }
  
      return actual.update({ estado: 'cerrada' }, { transaction: t });
    });
}

async function numeroCuentas(socioId, options = {}) {
  return CuentaAhorro.count({
    where: { socioId, estado: ['activa', 'inactiva'] },
    transaction: options.transaction,
  });
}
async function listarPorSocio(socioId, rol) {
  const where = { socioId };
  if (rol === 'cajero') where.estado = ['activa', 'inactiva'];
  return CuentaAhorro.findAll({ where, order: [['createdAt', 'DESC']] });
}

async function obtener(id, rol) {
  const cuenta = await CuentaAhorro.findByPk(id, { include: ['socio', 'transacciones'] });
  if (!cuenta) {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }
  if (rol === 'cajero' && cuenta.estado === 'cerrada') {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }
  return cuenta;
}

async function abrir(socioId, saldoInicial = 0) {
  return sequelize.transaction(async (transaction) => {
    const socio = await Socio.findByPk(socioId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!socio || socio.estado !== 'activo') {
      const err = new Error('Socio no encontrado o inactivo');
      err.status = 404;
      throw err;
    }

    const numCuentas = await numeroCuentas(socioId, { transaction });
    if (numCuentas >= 6) {
      const err = new Error('El socio ya tiene el número máximo de cuentas (6)');
      err.status = 409;
      throw err;
    }
    return CuentaAhorro.create({
      socioId,
      numeroCuenta: generarNumeroCuenta(),
      saldo: saldoInicial,
    }, { transaction });
  });
}

async function cambiarEstado(id, estado) {
  return sequelize.transaction(async (transaction) => {
    const cuentaInicial = await CuentaAhorro.findByPk(id, { transaction });
    if (!cuentaInicial) {
      const err = new Error('Cuenta no encontrada');
      err.status = 404;
      throw err;
    }

    const socio = await Socio.findByPk(cuentaInicial.socioId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const cuenta = await CuentaAhorro.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!cuenta) {
      const err = new Error('Cuenta no encontrada');
      err.status = 404;
      throw err;
    }
    if (cuenta.estado === 'cerrada') {
      const err = new Error('Una cuenta cerrada no se puede activar o desactivar');
      err.status = 400;
      throw err;
    }

    if (estado === 'activa' && (!socio || socio.estado !== 'activo')) {
      const err = new Error('No se puede activar una cuenta si el socio está inactivo');
      err.status = 400;
      throw err;
    }

    return cuenta.update({ estado }, { transaction });
  });
}

module.exports = { listar, listarPorSocio, obtener, abrir, numeroCuentas, cerrarCuenta, cambiarEstado };
