const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/pagos.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

router.get('/mora', auth, controller.listarEnMora);

router.post(
  '/',
  auth, checkRole('administrador', 'cajero'),
  [
    body('cuotaId').isUUID().withMessage('cuotaId inválido'),
    body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a cero'),
  ],
  validate,
  auditoria('registrar_pago'),
  controller.registrar
);

router.post('/calcular-mora', auth, checkRole('administrador'), controller.calcularMora);

module.exports = router;
