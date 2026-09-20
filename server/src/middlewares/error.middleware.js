// Manejo centralizado de errores
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Error interno del servidor',
    },
  });
}

module.exports = errorHandler;
