const auditoriaService = require('../services/auditoria.service');

// Campos que nunca deben quedar escritos en el log
const CAMPOS_SENSIBLES = ['password', 'token'];

function sanitizar(objeto) {
  if (!objeto || typeof objeto !== 'object') return objeto;
  const copia = { ...objeto };
  CAMPOS_SENSIBLES.forEach((campo) => delete copia[campo]);
  return copia;
}

// Registra en la tabla de auditoría quién hizo qué, sobre qué entidad y con qué datos.
// Uso en una ruta: auditoria('aprobar_prestamo', 'prestamo')
//
// - Solo registra operaciones exitosas (status < 400).
// - Toma el id de la entidad desde la respuesta (o desde :id en la URL).
// - Se ejecuta cuando la respuesta ya se envió: si el guardado del log
//   fallara, no afecta al usuario (el error se escribe en consola).
function auditoriaMiddleware(accion, entidad) {
  const middleware = (req, res, next) => {
    let cuerpoRespuesta;
    const jsonOriginal = res.json.bind(res);
    res.json = (cuerpo) => {
      cuerpoRespuesta = cuerpo;
      return jsonOriginal(cuerpo);
    };

    res.on('finish', () => {
      if (res.statusCode >= 400) return;

      // En el login todavía no hay req.user: el usuario viene en la respuesta.
      const usuarioId = req.user?.id || cuerpoRespuesta?.usuario?.id;
      if (!usuarioId) return;

      const entidadId = cuerpoRespuesta?.id || cuerpoRespuesta?.usuario?.id || req.params?.id || null;

      const detalle = { datos: sanitizar(req.body) };
      // Si la respuesta no es una entidad (p. ej. el resultado de calcular mora), se guarda el resultado
      if (!entidadId && cuerpoRespuesta) detalle.resultado = sanitizar(cuerpoRespuesta);

      auditoriaService
        .registrar({
          usuarioId,
          accion,
          entidad: entidad || null,
          entidadId: entidadId ? String(entidadId) : null,
          detalle: JSON.stringify(detalle),
        })
        .catch((err) => console.error('No se pudo registrar la auditoría:', err.message));
    });

    next();
  };

  return middleware;
}

module.exports = auditoriaMiddleware;
