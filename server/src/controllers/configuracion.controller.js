const configuracion = require('../services/configuracion.service');

function envolver(handler) {
  return async (req, res, next) => {
    try {
      res.json(await handler(req));
    } catch (err) {
      next(err);
    }
  };
}

const obtener = envolver((req) => configuracion.obtenerConfiguracion(req.query.anio));
const listarFeriados = envolver((req) => configuracion.listarFeriados(req.query.anio));
const crearFeriado = envolver((req) => configuracion.crearFeriado(req.body, req.user?.id));
const actualizarFeriado = envolver((req) => configuracion.actualizarFeriado(req.params.id, req.body, req.user?.id));
const eliminarFeriado = envolver((req) => configuracion.eliminarFeriado(req.params.id, req.user?.id));
const restaurarFeriados = envolver((req) => configuracion.restaurarFeriados(req.body.anio, req.user?.id));
const actualizarDiasNoLaborables = envolver((req) => configuracion.actualizarDiasNoLaborables(req.body.diasNoLaborables, req.user?.id));
const listarTasas = envolver(() => configuracion.listarTasas());
const actualizarTasaMora = envolver((req) => configuracion.actualizarTasaMora(req.body, req.user?.id));
const previsualizarRecalculo = envolver(() => configuracion.previsualizarRecalculo());
const recalcularCuotas = envolver((req) => configuracion.aplicarRecalculo(req.user?.id));

module.exports = {
  obtener,
  listarFeriados,
  crearFeriado,
  actualizarFeriado,
  eliminarFeriado,
  restaurarFeriados,
  actualizarDiasNoLaborables,
  listarTasas,
  actualizarTasaMora,
  previsualizarRecalculo,
  recalcularCuotas,
};
