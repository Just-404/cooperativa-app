// Registra en el módulo de auditoría cada acción relevante (quién hizo qué)
function auditoriaMiddleware(accion) {
  return (req, res, next) => {
    // TODO: persistir evento en el modelo Auditoria (usuario, acción, fecha, entidad afectada)
    next();
  };
}

module.exports = auditoriaMiddleware;
