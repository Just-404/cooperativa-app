const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/transacciones.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

const puedeOperar = checkRole('administrador', 'cajero');
const validarMonto = [
  body('cuentaId').isUUID().withMessage('cuentaId inválido'),
  body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a cero'),
];

router.get('/cuenta/:cuentaId', auth, controller.listarPorCuenta);
router.post('/depositos', auth, puedeOperar, validarMonto, validate, auditoria('deposito'), controller.depositar);
router.post('/retiros', auth, puedeOperar, validarMonto, validate, auditoria('retiro'), controller.retirar);

module.exports = router;
