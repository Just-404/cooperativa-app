const { Socio, CuentaAhorro, Prestamo, Cuota } = require('../models');
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

module.exports = { resumenGeneral, prestamosPorEstado };
