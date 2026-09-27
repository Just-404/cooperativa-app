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

module.exports = { listarEnMora, registrarPago, calcularMora };
