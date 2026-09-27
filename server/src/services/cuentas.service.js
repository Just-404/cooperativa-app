const { CuentaAhorro, Socio } = require('../models');

function generarNumeroCuenta() {
  return 'CTA-' + Date.now().toString().slice(-8);
}

async function listar() {
  return CuentaAhorro.findAll({ include: ['socio'], order: [['createdAt', 'DESC']] });
}

async function listarPorSocio(socioId) {
  return CuentaAhorro.findAll({ where: { socioId }, order: [['createdAt', 'DESC']] });
}

async function obtener(id) {
  const cuenta = await CuentaAhorro.findByPk(id, { include: ['socio', 'transacciones'] });
  if (!cuenta) {
    const err = new Error('Cuenta no encontrada');
    err.status = 404;
    throw err;
  }
  return cuenta;
}

async function abrir(socioId, saldoInicial = 0) {
  const socio = await Socio.findByPk(socioId);
  if (!socio) {
    const err = new Error('Socio no encontrado');
    err.status = 404;
    throw err;
  }
  return CuentaAhorro.create({
    socioId,
    numeroCuenta: generarNumeroCuenta(),
    saldo: saldoInicial,
  });
}

module.exports = { listar, listarPorSocio, obtener, abrir };
