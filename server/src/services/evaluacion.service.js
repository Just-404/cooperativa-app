const prestamosService = require('./prestamos.service');

async function evaluar(prestamoId, { comentario }) {
  const prestamo = await prestamosService.obtener(prestamoId);

  if (prestamo.estado !== 'solicitado') {
    const err = new Error(`No se puede evaluar un préstamo en estado "${prestamo.estado}"`);
    err.status = 400;
    throw err;
  }

  return prestamo.update({
    estado: 'evaluado',
    comentarioEvaluacion: comentario,
    fechaEvaluacion: new Date(),
  });
}

module.exports = { evaluar };
