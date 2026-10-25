const reportes = require('../services/reportes.service');

async function resumen(req, res, next) {
  try { res.json(await reportes.resumenGeneral()); } catch (err) { next(err); }
}
async function prestamosPorEstado(req, res, next) {
  try { res.json(await reportes.prestamosPorEstado()); } catch (err) { next(err); }
}
async function prestamosDelMes(req, res, next) {
  try {
    const { anio, mes } = req.query;
    res.json(await reportes.prestamosDelMes(anio, mes));
  } catch (err) { next(err); }
}
async function prestadoVsIngresos(req, res, next) {
  try {
    const meses = Math.min(Number(req.query.meses) || 6, 12);
    res.json(await reportes.prestadoVsIngresos(meses));
  } catch (err) { next(err); }
}

module.exports = { resumen, prestamosPorEstado, prestamosDelMes, prestadoVsIngresos };