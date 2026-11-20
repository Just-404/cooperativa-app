// Manejo centralizado de errores
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const mensajesValidacion = (Array.isArray(err.errors) ? err.errors : [])
    .map((detalle) => detalle.message)
    .filter(Boolean);
  const message = mensajesValidacion.length
    ? mensajesValidacion.join('; ')
    : (err.message || 'Error interno del servidor').replace(/^Validation error:\s*/i, '');

  res.status(status).json({
    error: {
      message,
    },
  });
}

module.exports = errorHandler;
