const { Socio, CuentaAhorro, Prestamo, Cuota, Pago } = require('../models');
const { Op, fn, col } = require('sequelize');

async function resumenGeneral() {
  const [totalSocios, totalAhorros, prestamosVigentes, cuotasEnMora] = await Promise.all([
    Socio.count({ where: { estado: 'activo' } }),
    CuentaAhorro.sum('saldo'),
    Prestamo.count({ where: { estado: 'desembolsado' } }),
    Cuota.count({ where: { estado: 'vencida' } }),
  ]);

  return {
    totalSocios,
    totalAhorros: totalAhorros || 0,
    prestamosVigentes,
    cuotasEnMora,
  };
}

async function prestamosPorEstado() {
  const resultados = await Prestamo.findAll({
    attributes: ['estado', [fn('COUNT', col('id')), 'total']],
    group: ['estado'],
  });
  return resultados;
}

async function prestamosDelMes(anio, mes) {
  const hoy = new Date();
  anio = Number(anio) || hoy.getFullYear();
  mes = Number(mes) || hoy.getMonth() + 1; // 1-12

  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 1);
  const rango = { [Op.gte]: desde, [Op.lt]: hasta };

  const [solicitados, aprobados, rechazados] = await Promise.all([
    Prestamo.count({ where: { fechaSolicitud: rango } }),
    // aprobados en ese mes (incluye los que luego fueron desembolsados)
    Prestamo.count({ where: { fechaAprobacion: rango } }),
    // rechazados: se asume que el rechazo ocurre al evaluar
    Prestamo.count({ where: { estado: 'rechazado', fechaEvaluacion: rango } }),
  ]);

  return { anio, mes, solicitados, aprobados, rechazados };
}

async function prestadoVsIngresos(meses = 6) {
  const hoy = new Date();
  const lista = [];

  for (let i = meses - 1; i >= 0; i--) {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 1);
    lista.push({ desde, hasta });
  }

  const filas = await Promise.all(
    lista.map(async ({ desde, hasta }) => {
      const rango = { [Op.gte]: desde, [Op.lt]: hasta };
      const [prestado, ingresos] = await Promise.all([
        Prestamo.sum('montoAprobado', { where: { fechaDesembolso: rango } }),
        Pago.sum('monto', { where: { fechaPago: rango } }),
      ]);
      return {
        anio: desde.getFullYear(),
        mes: desde.getMonth() + 1,
        prestado: Number(prestado) || 0,
        ingresos: Number(ingresos) || 0,
      };
    })
  );

  return filas;
}

module.exports = { resumenGeneral, prestamosPorEstado, prestamosDelMes, prestadoVsIngresos };
