const cuotas = require('../services/cuotas.service');

async function listarPorPrestamo(req, res, next) {
  try { res.json(await cuotas.listarPorPrestamo(req.params.prestamoId)); } catch (err) { next(err); }
}

async function recalcularFechasCuotas(req, res, next) {
  try {
    const resultado = await cuotas.recalcularFechasCuotas(req.params.prestamoId);
    res.json({
      mensaje: 'Fechas de vencimiento recalculadas',
      cuotasActualizadas: resultado.cuotasActualizadas,
    });
  } catch (err) { next(err); }
}

module.exports = { listarPorPrestamo, recalcularFechasCuotas };
