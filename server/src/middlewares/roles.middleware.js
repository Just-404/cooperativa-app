// Restringe el acceso según el rol del usuario autenticado
// Roles esperados: administrador, cajero, oficial_credito, gerente, auditor
function checkRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: { message: 'No tienes permisos para esta acción' } });
    }
    next();
  };
}

module.exports = checkRole;
