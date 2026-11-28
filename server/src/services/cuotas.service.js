const { Cuota, Prestamo } = require('../models');
const {
  aISO,
  calcularFechaVencimiento,
  calendarioPorDefecto,
} = require('../utils/feriados');

// Genera el plan de pagos con amortización francesa (cuota fija, interés sobre saldo pendiente)
// `options.calendario` permite usar el calendario configurable de Configuración.
async function generarCuotas(prestamo, options = {}) {
  const monto = Number(prestamo.montoAprobado);
  const plazo = prestamo.plazoMeses;
  const tasaMensual = Number(prestamo.tasaInteresAnual) / 100 / 12;
  const calendario = options.calendario || calendarioPorDefecto;

  // Fórmula de la cuota fija francesa: C = P * i / (1 - (1 + i)^-n)
  const cuotaFija = tasaMensual > 0
    ? Math.round(monto * tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazo)) * 100) / 100
    : Math.round(monto / plazo * 100) / 100;

  // La primera cuota vence un mes después del desembolso (o de hoy si no hay fecha).
  const fechaBase = aISO(prestamo.fechaDesembolso || new Date());
  const cuotas = [];
  let saldoPendiente = monto;
  let fechaAnterior = null;

  for (let i = 1; i <= plazo; i++) {
    const interesCuota = Math.round(saldoPendiente * tasaMensual * 100) / 100;
    let capitalCuota = Math.round((cuotaFija - interesCuota) * 100) / 100;

    // Ajuste en la última cuota por redondeos
    if (i === plazo) {
      capitalCuota = Math.round(saldoPendiente * 100) / 100;
    }

    // Fecha de vencimiento: base + i meses, sin caer en fin de semana ni feriado.
    const fechaVencimiento = calcularFechaVencimiento(fechaBase, i, fechaAnterior, calendario);
    fechaAnterior = fechaVencimiento;

    cuotas.push({
      prestamoId: prestamo.id,
      numeroCuota: i,
      montoCapital: capitalCuota,
      montoInteres: interesCuota,
      montoTotal: Math.round((capitalCuota + interesCuota) * 100) / 100,
      fechaVencimiento,
      estado: 'pendiente',
    });

    saldoPendiente = Math.round((saldoPendiente - capitalCuota) * 100) / 100;
  }

  return Cuota.bulkCreate(cuotas, { transaction: options.transaction });
}

async function listarPorPrestamo(prestamoId) {
  return Cuota.findAll({ where: { prestamoId }, order: [['fechaVencimiento', 'ASC'], ['numeroCuota', 'ASC']] });
}

// Recalcula las fechas de vencimiento de las cuotas pendientes de un préstamo
// a partir de su fecha de desembolso, moviendo las que caen en fin de semana o
// feriado al siguiente día laborable. Las cuotas pagadas o vencidas no se
// modifican (son historial), pero se usan como referencia para mantener el orden.
//
// options.dryRun => no escribe, solo devuelve los cambios que se aplicarían.
async function recalcularFechasCuotas(prestamoId, options = {}) {
  const prestamo = await Prestamo.findByPk(prestamoId);
  if (!prestamo) {
    const err = new Error('Préstamo no encontrado');
    err.status = 404;
    throw err;
  }
  if (prestamo.estado !== 'desembolsado') {
    const err = new Error('Solo se pueden recalcular fechas de préstamos desembolsados y no cerrados');
    err.status = 400;
    throw err;
  }

  const calendario = options.calendario || calendarioPorDefecto;
  const fechaBase = aISO(prestamo.fechaDesembolso || prestamo.fechaSolicitud || new Date());

  const cuotas = await Cuota.findAll({
    where: { prestamoId },
    order: [['numeroCuota', 'ASC']],
    transaction: options.transaction,
  });

  let actualizadas = 0;
  let fechaAnterior = null;
  const cambios = [];

  for (const cuota of cuotas) {
    const fechaActual = aISO(cuota.fechaVencimiento);

    // Las cuotas ya pagadas o vencidas no se tocan
    if (cuota.estado !== 'pendiente') {
      if (!fechaAnterior || fechaActual > fechaAnterior) fechaAnterior = fechaActual;
      continue;
    }

    const fechaVencimiento = calcularFechaVencimiento(fechaBase, cuota.numeroCuota, fechaAnterior, calendario);

    if (fechaActual !== fechaVencimiento) {
      cambios.push({
        cuotaId: cuota.id,
        prestamoId,
        numeroCuota: cuota.numeroCuota,
        fechaAnterior: fechaActual,
        fechaNueva: fechaVencimiento,
      });
      if (!options.dryRun) {
        await cuota.update({ fechaVencimiento }, { transaction: options.transaction });
      }
      actualizadas++;
    }

    fechaAnterior = fechaVencimiento;
  }

  return { cuotasActualizadas: actualizadas, fechaBase, cambios };
}

module.exports = { generarCuotas, listarPorPrestamo, recalcularFechasCuotas };
