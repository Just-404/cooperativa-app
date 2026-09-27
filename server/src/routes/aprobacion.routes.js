const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/aprobacion.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();
const soloGerente = checkRole('administrador', 'gerente');

router.post(
  '/:id/aprobar',
  auth, soloGerente,
  [body('montoAprobado').optional().isFloat({ gt: 0 })],
  validate,
  auditoria('aprobar_prestamo'),
  controller.aprobar
);

router.post(
  '/:id/rechazar',
  auth, soloGerente,
  [body('comentario').notEmpty().withMessage('El motivo del rechazo es requerido')],
  validate,
  auditoria('rechazar_prestamo'),
  controller.rechazar
);

module.exports = router;
