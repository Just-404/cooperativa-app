const { Cuota } = require('../models');

// Genera el plan de pagos con amortización francesa (cuota fija, interés sobre saldo pendiente)
async function generarCuotas(prestamo, options = {}) {
  const monto = Number(prestamo.montoAprobado);
  const plazo = prestamo.plazoMeses;
  const tasaMensual = Number(prestamo.tasaInteresAnual) / 100 / 12;

  // Fórmula de la cuota fija francesa: C = P * i / (1 - (1 + i)^-n)
  const cuotaFija = tasaMensual > 0
    ? round2(monto * tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazo)))
    : round2(monto / plazo);

  const hoy = new Date();
  const cuotas = [];
  let saldoPendiente = monto;

  for (let i = 1; i <= plazo; i++) {
    const interesCuota = round2(saldoPendiente * tasaMensual);
    let capitalCuota = round2(cuotaFija - interesCuota);

    // Ajuste en la última cuota por redondeos
    if (i === plazo) {
      capitalCuota = round2(saldoPendiente);
    }

    const fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth() + i, hoy.getDate());
    cuotas.push({
      prestamoId: prestamo.id,
      numeroCuota: i,
      montoCapital: capitalCuota,
      montoInteres: interesCuota,
      montoTotal: round2(capitalCuota + interesCuota),
      fechaVencimiento,
      estado: 'pendiente',
    });

    saldoPendiente = round2(saldoPendiente - capitalCuota);
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
