const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/socios.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

const puedeEscribir = checkRole('administrador', 'oficial_credito');

router.get('/', auth, controller.listar);
router.get('/:id', auth, controller.obtener);

router.post(
  '/',
  auth, puedeEscribir,
  [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellido').notEmpty().withMessage('El apellido es requerido'),
    body('documento').notEmpty().withMessage('El documento es requerido'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email inválido'),
  ],
  validate,
  auditoria('crear_socio'),
  controller.crear
);

router.put('/:id', auth, puedeEscribir, auditoria('actualizar_socio'), controller.actualizar);
router.patch('/:id/estado', auth, puedeEscribir, auditoria('cambiar_estado_socio'), controller.cambiarEstado);

module.exports = router;
