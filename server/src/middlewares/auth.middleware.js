const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Verifica el JWT enviado en el header Authorization: Bearer <token>
// y adjunta el usuario decodificado a req.user
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Token no proporcionado' } });
  }

  const token = header.split(' ')[1];

  try {
    req.user = jwt.verify(token, env.jwt.secret);
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Token inválido o expirado' } });
  }
}

module.exports = authMiddleware;
