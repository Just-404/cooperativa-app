const { sequelize, Cuota, Pago, Prestamo } = require('../models');

const TASA_MORA_DIARIA = 0.001; // 0.1% diario sobre el monto de la cuota vencida

function calcularMoraDeCuota(cuota) {
  if (cuota.estado === 'pagada') return 0;
  const hoy = new Date();
  const vencimiento = new Date(cuota.fechaVencimiento);
  const diasVencidos = Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24));
  if (diasVencidos <= 0) return 0;
  return Math.round(Number(cuota.montoTotal) * TASA_MORA_DIARIA * diasVencidos * 100) / 100;
}

// Recorre las cuotas pendientes y marca como "vencida" las que ya pasaron su fecha,
// actualizando el monto de mora acumulado. Puede dispararse desde un endpoint
// administrativo o desde un scheduler externo al proceso Node.
async function calcularMora() {
  const cuotasPendientes = await Cuota.findAll({ where: { estado: 'pendiente' } });
  let actualizadas = 0;

  for (const cuota of cuotasPendientes) {
    const mora = calcularMoraDeCuota(cuota);
    if (mora > 0) {
      await cuota.update({ estado: 'vencida', montoMora: mora });
      actualizadas++;
    }
  }

  return { cuotasEnMora: actualizadas };
}

async function listarEnMora() {
  return Cuota.findAll({
    where: { estado: 'vencida' },
    include: [{ association: 'prestamo', include: ['socio'] }],
    order: [['fechaVencimiento', 'ASC']],
  });
}

// Verifica que no haya cuotas anteriores impagas antes de permitir pagar una cuota
async function validarCuotasAnterioresPagadas(prestamoId, numeroCuota, transaction) {
  const cuotasImpagas = await Cuota.count({
    where: {
      prestamoId,
      numeroCuota: { [sequelize.Sequelize.Op.lt]: numeroCuota },
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

// Registra el pago de una cuota (incluye mora si aplica)
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
    await validarCuotasAnterioresPagadas(cuota.prestamoId, cuota.numeroCuota, t);

    const mora = cuota.estado === 'vencida' ? Number(cuota.montoMora) : 0;
    const totalEsperado = Number(cuota.montoTotal) + mora;

    if (Number(monto) < totalEsperado) {
      const err = new Error(`El monto debe cubrir el total de la cuota más la mora (${totalEsperado})`);
      err.status = 400;
      throw err;
    }

    await cuota.update({ estado: 'pagada' }, { transaction: t });

    const pago = await Pago.create({
      cuotaId,
      usuarioId,
      monto,
      moraCobrada: mora,
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
      const nuevoCapital = round2(capitalActual - reduccion);
      const nuevoTotal = round2(nuevoCapital + Number(cuota.montoInteres));

      await cuota.update({
        montoCapital: nuevoCapital,
        montoTotal: nuevoTotal,
      }, { transaction: t });

      montoRestante = round2(montoRestante - reduccion);
    }

    // Registrar el abono como un pago sin cuotaId (o con tipo especial)
    const pago = await Pago.create({
      cuotaId: null,
      usuarioId,
      monto,
      moraCobrada: 0,
      tipo: 'abono_capital', // se asume que la tabla Pago tiene este campo o se ignora
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
