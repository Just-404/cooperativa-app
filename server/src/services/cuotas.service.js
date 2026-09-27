const { Cuota, Prestamo } = require('../models');

// Genera el plan de pagos con amortización simple (cuota fija, interés lineal sobre el capital original)
async function generarCuotas(prestamo, options = {}) {
  const monto = Number(prestamo.montoAprobado);
  const plazo = prestamo.plazoMeses;
  const tasaMensual = Number(prestamo.tasaInteresAnual) / 100 / 12;

  const interesTotal = monto * tasaMensual * plazo;
  const montoCapitalPorCuota = round2(monto / plazo);
  const montoInteresPorCuota = round2(interesTotal / plazo);

  const hoy = new Date();
  const cuotas = [];

  for (let i = 1; i <= plazo; i++) {
    const fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth() + i, hoy.getDate());
    cuotas.push({
      prestamoId: prestamo.id,
      numeroCuota: i,
      montoCapital: montoCapitalPorCuota,
      montoInteres: montoInteresPorCuota,
      montoTotal: round2(montoCapitalPorCuota + montoInteresPorCuota),
      fechaVencimiento,
      estado: 'pendiente',
    });
  }

  return Cuota.bulkCreate(cuotas, { transaction: options.transaction });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function listarPorPrestamo(prestamoId) {
  return Cuota.findAll({ where: { prestamoId }, order: [['numeroCuota', 'ASC']] });
}

module.exports = { generarCuotas, listarPorPrestamo };
