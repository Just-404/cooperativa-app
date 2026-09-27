const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/cuentas.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

const puedeOperar = checkRole('administrador', 'cajero');

router.get('/', auth, controller.listar);
router.get('/socio/:socioId', auth, controller.listarPorSocio);
router.get('/:id', auth, controller.obtener);

router.post(
  '/',
  auth, puedeOperar,
  [
    body('socioId').isUUID().withMessage('socioId inválido'),
    body('saldoInicial').optional().isFloat({ min: 0 }).withMessage('El saldo inicial no puede ser negativo'),
  ],
  validate,
  auditoria('abrir_cuenta'),
  controller.abrir
);

module.exports = router;
