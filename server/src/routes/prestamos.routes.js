const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/prestamos.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

router.get('/', auth, controller.listar);
router.get('/:id', auth, controller.obtener);

router.post(
  '/:id/revertir-estado',
  auth, checkRole('administrador'),
  auditoria('revertir_estado_prestamo', 'prestamo'),
  controller.revertirEstado
);

router.delete(
  '/:id',
  auth, checkRole('administrador', 'cajero'),
  auditoria('eliminar_solicitud_prestamo', 'prestamo'),
  controller.deshacerSolicitud
);

router.post(
  '/',
  auth, checkRole('administrador', 'cajero'),
  [
    body('socioId').isUUID().withMessage('socioId inválido'),
    body('tipoPrestamoId').isUUID().withMessage('tipoPrestamoId inválido'),
    body('montoSolicitado').isFloat({ gt: 0 }).withMessage('El monto solicitado debe ser mayor a cero').toFloat(),
    body('plazoMeses').isInt({ min: 1 }).withMessage('El plazo debe ser al menos 1 mes').toInt(),
  ],
  validate,
  auditoria('solicitar_prestamo', 'prestamos'),
  controller.solicitar
);

module.exports = router;
