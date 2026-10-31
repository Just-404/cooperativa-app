const { sequelize, Cuota, Pago, Prestamo } = require('../models');
const { aISO, esDiaLaborable, diferenciaDias } = require('../utils/feriados');

// Tasa de mora diaria: 0.1% sobre el monto de la cuota vencida
// Se puede ajustar según políticas de la cooperativa
const TASA_MORA_DIARIA = 0.001; // 0.1% diario

// Calcular mora de una cuota vencida
function calcularMoraDeCuota(cuota) {
  if (cuota.estado === 'pagada') return 0;

  const vencimiento = aISO(cuota.fechaVencimiento);
  const diasVencidos = diferenciaDias(vencimiento, aISO(new Date()));

  if (diasVencidos <= 0) return 0;

  // Si el vencimiento cayó en fin de semana o feriado se concede un día de gracia
  const diasConMora = esDiaLaborable(vencimiento) ? diasVencidos : Math.max(0, diasVencidos - 1);

  return Math.round(Number(cuota.montoTotal) * TASA_MORA_DIARIA * diasConMora * 100) / 100;
}

// Recorre las cuotas no pagadas y recalcula la mora de las que ya pasaron su fecha,
// marcándolas como "vencida" y actualizando el monto de mora acumulado.
// Si una cuota marcada como vencida ya no está vencida (fecha futura), se devuelve
// a "pendiente" y se limpia la mora.
async function calcularMora() {
  const cuotasNoPagadas = await Cuota.findAll({ where: { estado: { [sequelize.Sequelize.Op.in]: ['pendiente', 'vencida'] } } });
  let actualizadas = 0;

  for (const cuota of cuotasNoPagadas) {
    const mora = calcularMoraDeCuota(cuota);

    if (mora > 0) {
      if (cuota.estado !== 'vencida' || Number(cuota.montoMora) !== mora) {
        await cuota.update({ estado: 'vencida', montoMora: mora });
        actualizadas++;
      }
    } else if (cuota.estado === 'vencida' || Number(cuota.montoMora) > 0) {
      await cuota.update({ estado: 'pendiente', montoMora: 0 });
      actualizadas++;
    }
  }

  return { cuotasEnMora: actualizadas };
}

// Listar cuotas en mora con información del préstamo y socio
async function listarEnMora() {
  return Cuota.findAll({
    where: { estado: 'vencida' },
    include: [
      { association: 'prestamo', include: ['socio'] },
    ],
    order: [['fechaVencimiento', 'ASC']],
  });
}

// Verifica que no haya cuotas anteriores impagas antes de permitir pagar una cuota
async function validarCuotasAnterioresPagadas(prestamoId, fechaVencimiento, transaction) {
  const cuotasImpagas = await Cuota.count({
    where: {
      prestamoId,
      fechaVencimiento: { [sequelize.Sequelize.Op.lt]: fechaVencimiento },
      estado: ['pendiente', 'vencida'],
    },
    transaction,
  });
  if (cuotasImpagas > 0) {
    const err = new Error('No se puede pagar esta cuota: existen cuotas anteriores sin pagar');
    err.status = 400;
    throw err;
  }
}

// Registrar el pago de una cuota (incluye mora si aplica)
async function registrarPago(cuotaId, monto, usuarioId) {
  return sequelize.transaction(async (t) => {
    const cuota = await Cuota.findByPk(cuotaId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!cuota) {
      const err = new Error('Cuota no encontrada');
      err.status = 404;
      throw err;
    }
    if (cuota.estado === 'pagada') {
      const err = new Error('Esta cuota ya fue pagada');
      err.status = 400;
      throw err;
    }

    // Validar cuotas anteriores pagadas
    await validarCuotasAnterioresPagadas(cuota.prestamoId, cuota.fechaVencimiento, t);

    // Calcular mora basada en la fecha de vencimiento y días laborables
    const mora = cuota.estado === 'vencida' ? Number(cuota.montoMora) : 0;

    // Verificar si el pago se realiza en un día no laborable - si es así, no aplicar mora
    const fechaPago = new Date();
    const esPagoFeriado = !esDiaLaborable(aISO(fechaPago));

    const totalEsperado = esPagoFeriado ? Number(cuota.montoTotal) : Number(cuota.montoTotal) + mora;

    if (Number(monto) < totalEsperado) {
      const err = new Error(`El monto debe cubrir el total de la cuota${esPagoFeriado ? ' (día feriado, sin mora)' : ''} más la mora (${totalEsperado})`);
      err.status = 400;
      throw err;
    }

    // Si el pago es en feriado, se descuenta la mora
    const moraAplicar = esPagoFeriado ? 0 : mora;

    await cuota.update({ estado: 'pagada' }, { transaction: t });

    const pago = await Pago.create({
      cuotaId,
      usuarioId,
      monto,
      moraCobrada: moraAplicar,
    }, { transaction: t });

    // Si todas las cuotas del préstamo están pagas, se cierra el préstamo
    const cuotasPendientes = await Cuota.count({
      where: { prestamoId: cuota.prestamoId, estado: ['pendiente', 'vencida'] },
      transaction: t,
    });
    if (cuotasPendientes === 0) {
      await Prestamo.update({ estado: 'cerrado' }, { where: { id: cuota.prestamoId }, transaction: t });
    }

    return pago;
  });
}

// Abono a capital: reduce el saldo pendiente y recalcula cuotas futuras
async function registrarAbonoCapital(prestamoId, monto, usuarioId) {
  return sequelize.transaction(async (t) => {
    const prestamo = await Prestamo.findByPk(prestamoId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!prestamo) {
      const err = new Error('Préstamo no encontrado');
      err.status = 404;
      throw err;
    }
    if (prestamo.estado !== 'desembolsado' && prestamo.estado !== 'cerrado') {
      const err = new Error('Solo se puede abonar capital a préstamos desembolsados');
      err.status = 400;
      throw err;
    }

    // Obtener cuotas pendientes/vencidas ordenadas
    const cuotasPendientes = await Cuota.findAll({
      where: { prestamoId, estado: ['pendiente', 'vencida'] },
      order: [['numeroCuota', 'ASC']],
      transaction: t,
    });

    if (cuotasPendientes.length === 0) {
      const err = new Error('No hay cuotas pendientes para aplicar abono');
      err.status = 400;
      throw err;
    }

    let montoRestante = Number(monto);

    // Aplicar abono a las cuotas futuras (reduce capital de cada cuota)
    for (const cuota of cuotasPendientes) {
      if (montoRestante <= 0) break;

      const capitalActual = Number(cuota.montoCapital);
      const reduccion = Math.min(capitalActual, montoRestante);
      const nuevoCapital = Math.round((capitalActual - reduccion) * 100) / 100;
      const nuevoTotal = Math.round((nuevoCapital + Number(cuota.montoInteres)) * 100) / 100;

      await cuota.update({
        montoCapital: nuevoCapital,
        montoTotal: nuevoTotal,
      }, { transaction: t });

      montoRestante = Math.round((montoRestante - reduccion) * 100) / 100;
    }

    // Registrar el abono como un pago sin cuotaId
    const pago = await Pago.create({
      cuotaId: null,
      usuarioId,
      monto,
      moraCobrada: 0,
      tipo: 'abono_capital',
    }, { transaction: t });

    // Si el préstamo ya estaba cerrado y se abre de nuevo, o verificar cierre
    const cuotasQuedan = await Cuota.count({
      where: { prestamoId, estado: ['pendiente', 'vencida'] },
      transaction: t,
    });
    if (cuotasQuedan === 0) {
      await Prestamo.update({ estado: 'cerrado' }, { where: { id: prestamoId }, transaction: t });
    }

    return { pago, montoAplicado: Number(monto) - montoRestante };
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { listarEnMora, registrarPago, calcularMora, registrarAbonoCapital };