const prestamosService = require('./prestamos.service');

async function aprobar(prestamoId, { montoAprobado, comentario }, usuarioAprobadorId) {
  const prestamo = await prestamosService.obtener(prestamoId);

  if (prestamo.estado !== 'evaluado') {
    const err = new Error('El préstamo debe estar evaluado antes de aprobarse');
    err.status = 400;
    throw err;
  }

  return prestamo.update({
    estado: 'aprobado',
    montoAprobado: montoAprobado || prestamo.montoSolicitado,
    comentarioAprobacion: comentario,
    usuarioAprobadorId,
    fechaAprobacion: new Date(),
  });
}

async function rechazar(prestamoId, { comentario }, usuarioAprobadorId) {
  const prestamo = await prestamosService.obtener(prestamoId);

  if (prestamo.estado !== 'evaluado') {
    const err = new Error('El préstamo debe estar evaluado antes de rechazarse');
    err.status = 400;
    throw err;
  }

  return prestamo.update({
    estado: 'rechazado',
    comentarioAprobacion: comentario,
    usuarioAprobadorId,
    fechaAprobacion: new Date(),
  });
}

module.exports = { aprobar, rechazar };
