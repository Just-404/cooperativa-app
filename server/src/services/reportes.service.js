const { Socio, CuentaAhorro, Prestamo, Cuota, Pago, TipoPrestamo } = require('../models');
const { Op, fn, col } = require('sequelize');

async function resumenGeneral() {
  const [sociosPorEstado, totalAhorros, prestamosVigentes, cuotasEnMora] = await Promise.all([
    Socio.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      group: ['estado'],
      raw: true,
    }),
    CuentaAhorro.sum('saldo'),
    Prestamo.count({ where: { estado: 'desembolsado' } }),
    Cuota.count({ where: { estado: 'vencida' } }),
  ]);

  const totalSocios = sociosPorEstado.reduce((s, f) => s + Number(f.total), 0);
  const sociosActivos = Number(sociosPorEstado.find((f) => f.estado === 'activo')?.total || 0);

  return {
    totalSocios: sociosActivos,              // se mantiene igual para no romper el front
    sociosInactivos: totalSocios - sociosActivos,
    sociosTotal: totalSocios,
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

// Cuentas abiertas vs cerradas por mes
async function cuentasMovimiento(meses = 6) {
  const hoy = new Date();
  const rangos = [];

  for (let i = meses - 1; i >= 0; i--) {
    rangos.push({
      desde: new Date(hoy.getFullYear(), hoy.getMonth() - i, 1),
      hasta: new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 1),
    });
  }

  return Promise.all(
    rangos.map(async ({ desde, hasta }) => {
      const rango = { [Op.gte]: desde, [Op.lt]: hasta };

      const [abiertas, cerradas] = await Promise.all([
        CuentaAhorro.count({ where: { createdAt: rango } }),
        CuentaAhorro.count({
          where: {
            estado: 'cerrada', // ajusta al valor real de tu ENUM
            updatedAt: rango,
          },
        }),
      ]);

      const mes = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, '0')}`;
      return { mes, abiertas, cerradas };
    })
  );
}

// Préstamos por tipo (ordenado de mayor a menor)
async function prestamosPorTipo() {
  const [tipos, conteos] = await Promise.all([
    TipoPrestamo.findAll({ attributes: ['id', 'nombre'], raw: true }),
    Prestamo.findAll({
      attributes: ['tipoPrestamoId', [fn('COUNT', col('id')), 'cantidad']],
      group: ['tipoPrestamoId'],
      raw: true,
    }),
  ]);

  const mapa = new Map(conteos.map((c) => [c.tipoPrestamoId, Number(c.cantidad)]));

  return tipos
    .map((t) => ({ nombre: t.nombre, cantidad: mapa.get(t.id) || 0 }))
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
}

module.exports = { resumenGeneral, prestamosPorEstado, prestamosDelMes, prestadoVsIngresos, cuentasMovimiento, prestamosPorTipo };
