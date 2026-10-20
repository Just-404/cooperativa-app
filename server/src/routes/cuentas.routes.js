const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/cuentas.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

const puedeGestionar = checkRole('administrador', 'oficial_credito');

router.get('/', auth, controller.listar);
router.get('/socio/:socioId', auth, controller.listarPorSocio);
router.get('/:id', auth, controller.obtener);

router.post(
  '/',
  auth, puedeGestionar,
  [
    body('socioId').isUUID().withMessage('socioId inválido'),
    body('saldoInicial').optional().isFloat({ min: 0 }).withMessage('El saldo inicial no puede ser negativo'),
  ],
  validate,
  auditoria('abrir_cuenta', 'cuenta'),
  controller.abrir
);

router.patch(
  '/:id/estado',
  auth, puedeGestionar,
  [body('estado').isIn(['activa', 'inactiva']).withMessage('Estado inválido')],
  validate,
  auditoria('cambiar_estado_cuenta', 'cuenta'),
  controller.cambiarEstado
);

router.delete('/socio/cerrarCuenta/:cuentaId', auth, puedeGestionar, validate, auditoria('cerrar_cuenta', 'cuenta'), controller.cerrarCuenta)

module.exports = router;
