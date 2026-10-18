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
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
    body('documento').trim().notEmpty().withMessage('El documento es requerido'),
    body('email').trim().notEmpty().withMessage('El email es requerido').bail().isEmail().withMessage('Email inválido'),
    body('telefono').trim().notEmpty().withMessage('El teléfono es requerido'),
    body('direccion').trim().notEmpty().withMessage('La dirección es requerida'),
    body('fechaNacimiento')
      .trim()
      .notEmpty().withMessage('La fecha de nacimiento es requerida')
      .bail()
      .isISO8601({ strict: true }).withMessage('La fecha de nacimiento es inválida'),
  ],
  validate,
  auditoria('crear_socio'),
  controller.crear
);

router.put('/:id', auth, puedeEscribir, auditoria('actualizar_socio'), controller.actualizar);
router.patch('/:id/estado', auth, puedeEscribir, auditoria('cambiar_estado_socio'), controller.cambiarEstado);

module.exports = router;
