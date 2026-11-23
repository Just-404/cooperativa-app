const cuotas = require('../services/cuotas.service');
const pagos = require('../services/pagos.service');
const configuracion = require('../services/configuracion.service');

async function listarPorPrestamo(req, res, next) {
  try {
    // Refresca la mora del préstamo para que el detalle nunca muestre datos stale.
    await pagos.actualizarMoraPrestamo(req.params.prestamoId);
    res.json(await cuotas.listarPorPrestamo(req.params.prestamoId));
  } catch (err) {
    next(err);
  }
}

async function recalcularFechasCuotas(req, res, next) {
  try {
    const resultado = await cuotas.recalcularFechasCuotas(req.params.prestamoId, {
      calendario: configuracion.calendarioSeguro(),
    });
    res.json({
      mensaje: 'Fechas de vencimiento recalculadas',
      cuotasActualizadas: resultado.cuotasActualizadas,
      cambios: resultado.cambios,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPorPrestamo, recalcularFechasCuotas };
