const { ScoringCrediticio, Pago, Cuota, Prestamo } = require('../models');

async function obtenerPorSocio(socioId) {
  return ScoringCrediticio.findAll({
    where: { socioId },
    order: [['fechaEvaluacion', 'DESC']],
  });
}

// Cálculo simplificado: parte de una base de 600 puntos, suma por pagos puntuales
// y resta por cuotas en mora dentro de los préstamos del socio.
async function calcular(socioId) {
  const prestamos = await Prestamo.findAll({ where: { socioId }, attributes: ['id'] });
  const prestamoIds = prestamos.map((p) => p.id);

  const cuotasPagadas = await Cuota.count({ where: { prestamoId: prestamoIds, estado: 'pagada' } });
  const cuotasEnMora = await Cuota.count({ where: { prestamoId: prestamoIds, estado: 'vencida' } });

  let puntaje = 600 + cuotasPagadas * 5 - cuotasEnMora * 20;
  puntaje = Math.max(300, Math.min(850, puntaje));

  return ScoringCrediticio.create({
    socioId,
    puntaje,
    factores: { cuotasPagadas, cuotasEnMora },
  });
}

module.exports = { obtenerPorSocio, calcular };
