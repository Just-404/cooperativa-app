const reportes = require('../services/reportes.service');

async function resumen(req, res, next) {
  try { res.json(await reportes.resumenGeneral()); } catch (err) { next(err); }
}
async function prestamosPorEstado(req, res, next) {
  try { res.json(await reportes.prestamosPorEstado()); } catch (err) { next(err); }
}

module.exports = { resumen, prestamosPorEstado };
