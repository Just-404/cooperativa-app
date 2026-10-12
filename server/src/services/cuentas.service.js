const { CuentaAhorro, Socio, sequelize } = require('../models');

function generarNumeroCuenta() {
  return 'CTA-' + Date.now().toString().slice(-8);
}

async function listar() {
  return CuentaAhorro.findAll({ include: ['socio'], order: [['createdAt', 'DESC']] });
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

async function numeroCuentas(socioId){
  return CuentaAhorro.count({ where: { socioId } })
}
async function listarPorSocio(socioId) {
  return CuentaAhorro.findAll({ where: { socioId }, order: [['createdAt', 'DESC']], where: {estado: "activa"} });
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

  const numCuentas = await numeroCuentas(socioId);
    
  if(numCuentas >= 6){
    const err = new Error("El socio ya tiene el número máximo de cuentas (6)");
    err.status = 409;
    throw err;
  }
  return CuentaAhorro.create({
    socioId,
    numeroCuenta: generarNumeroCuenta(),
    saldo: saldoInicial,
  });
}

module.exports = { listar, listarPorSocio, obtener, abrir, numeroCuentas, cerrarCuenta };
