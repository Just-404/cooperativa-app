const { validationResult } = require('express-validator');

// Revisa los resultados de express-validator y corta la petición si hay errores
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: { message: 'Datos inválidos', details: errors.array() } });
  }
  next();
}

module.exports = validate;
