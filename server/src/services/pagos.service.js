const { sequelize, Cuota, Pago, Prestamo } = require('../models');
const { aISO, diferenciaDias } = require('../utils/feriados');
const { calcularMontoMora, round6 } = require('../utils/mora');
const configuracion = require('./configuracion.service');

// Resuelve la tasa de una cuota: si ya se volvió vencida conserva su snapshot;
// si todavía no, se toma la tasa vigente en su fecha de vencimiento.
function tasaParaCuota(cuota) {
  const snapshot = cuota.tasaMoraAplicada == null ? null : Number(cuota.tasaMoraAplicada);
  if (snapshot !== null && Number.isFinite(snapshot)) {
    return { tasaDiaria: snapshot, origen: 'snapshot' };
  }
  const tasa = configuracion.resolverTasaParaFecha(cuota.fechaVencimiento);
  return { tasaDiaria: Number(tasa.tasaDiaria), origen: 'vigente' };
}

function detalleMoraDeCuota(cuota, hoy = null) {
  if (cuota.estado === 'pagada') {
    return { monto: 0, diasAtraso: 0, tasaDiaria: null, origen: null };
  }

  const fechaHoy = aISO(hoy || new Date());
  const diasAtraso = Math.max(0, diferenciaDias(aISO(cuota.fechaVencimiento), fechaHoy));
  if (diasAtraso === 0) {
    return { monto: 0, diasAtraso: 0, tasaDiaria: null, origen: null };
  }

  const { tasaDiaria, origen } = tasaParaCuota(cuota);
  const { monto } = calcularMontoMora({
    montoTotal: cuota.montoTotal,
    fechaVencimiento: cuota.fechaVencimiento,
    tasaDiaria,
    hoy: fechaHoy,
  });

  return { monto, diasAtraso, tasaDiaria, origen };
}

// Compatibilidad con llamadores que solo esperan el monto.
function calcularMoraDeCuota(cuota, hoy = null) {
  return detalleMoraDeCuota(cuota, hoy).monto;
}

// Recorre las cuotas no pagadas de un préstamo y actualiza su mora.
async function actualizarMoraPrestamo(prestamoId) {
  const cuotas = await Cuota.findAll({
    where: { prestamoId, estado: ['pendiente', 'vencida'] },
  });
  const hoy = aISO(new Date());
  let actualizadas = 0;

  for (const cuota of cuotas) {
    const { monto, tasaDiaria } = detalleMoraDeCuota(cuota, hoy);
    const vencida = monto > 0 || cuota.estado === 'vencida';
    const cambios = {};

    if (vencida && cuota.estado !== 'vencida') cambios.estado = 'vencida';
    if (!vencida && cuota.estado === 'vencida') cambios.estado = 'pendiente';
    if (vencida && cuota.tasaMoraAplicada == null && tasaDiaria != null) {
      cambios.tasaMoraAplicada = round6(tasaDiaria);
    }
    if (Number(cuota.montoMora) !== monto) cambios.montoMora = monto;

    if (Object.keys(cambios).length > 0) {
      await cuota.update(cambios);
      actualizadas++;
    }
  }

  return actualizadas;
}

// Recorre todas las cuotas no pagadas y recalcula la mora. Las cuotas vencidas
// conservan la tasa que tenían cuando empezaron a generar mora.
async function calcularMora() {
  const cuotasNoPagadas = await Cuota.findAll({
    where: { estado: { [sequelize.Sequelize.Op.in]: ['pendiente', 'vencida'] } },
  });
  const hoy = aISO(new Date());
  let actualizadas = 0;

  for (const cuota of cuotasNoPagadas) {
    const { monto, tasaDiaria } = detalleMoraDeCuota(cuota, hoy);
    const vencida = monto > 0 || cuota.estado === 'vencida';
    const cambios = {};

    if (vencida && cuota.estado !== 'vencida') cambios.estado = 'vencida';
    if (!vencida && cuota.estado === 'vencida') cambios.estado = 'pendiente';
    if (vencida && cuota.tasaMoraAplicada == null && tasaDiaria != null) {
      cambios.tasaMoraAplicada = round6(tasaDiaria);
    }
    if (Number(cuota.montoMora) !== monto) cambios.montoMora = monto;

    if (Object.keys(cambios).length > 0) {
      await cuota.update(cambios);
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

// Registrar el pago de una cuota (incluye mora si aplica).
// La mora se recalcula aquí para no cobrar de menos si no se había ejecutado
// `calcularMora` todavía. Pagar en día feriado ya no la condona.
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

    await validarCuotasAnterioresPagadas(cuota.prestamoId, cuota.fechaVencimiento, t);

    const { monto: mora, tasaDiaria } = detalleMoraDeCuota(cuota);
    const totalEsperado = Math.round((Number(cuota.montoTotal) + mora) * 100) / 100;

    if (Number(monto) < totalEsperado) {
      const err = new Error(`El monto debe cubrir la cuota más la mora (${totalEsperado})`);
      err.status = 400;
      throw err;
    }

    const tasaAplicar = mora > 0 && tasaDiaria != null ? round6(tasaDiaria) : null;
    await cuota.update({
      estado: 'pagada',
      montoMora: mora,
      tasaMoraAplicada: tasaAplicar || cuota.tasaMoraAplicada,
    }, { transaction: t });

    const pago = await Pago.create({
      cuotaId,
      usuarioId,
      monto,
      moraCobrada: mora,
      tasaMoraAplicada: tasaAplicar,
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
    if (prestamo.estado !== 'desembolsado') {
      const err = new Error('Solo se puede abonar capital a préstamos desembolsados y no cerrados');
      err.status = 400;
      throw err;
    }

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

    const pago = await Pago.create({
      cuotaId: null,
      usuarioId,
      monto,
      moraCobrada: 0,
      tipo: 'abono_capital',
    }, { transaction: t });

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

module.exports = {
  listarEnMora,
  registrarPago,
  calcularMora,
  registrarAbonoCapital,
  calcularMoraDeCuota,
  detalleMoraDeCuota,
  actualizarMoraPrestamo,
  round2,
};
