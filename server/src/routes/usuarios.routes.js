const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/usuarios.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();
const soloAdmin = checkRole('administrador');

router.get('/', auth, soloAdmin, controller.listar);

router.post(
  '/',
  auth, soloAdmin,
  [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('rol').isIn(['administrador', 'cajero', 'oficial_credito', 'gerente', 'auditor']).withMessage('Rol inválido'),
  ],
  validate,
  auditoria('crear_usuario'),
  controller.crear
);

router.put('/:id', auth, soloAdmin, auditoria('actualizar_usuario'), controller.actualizar);
router.patch('/:id/estado', auth, soloAdmin, auditoria('cambiar_estado_usuario'), controller.cambiarEstado);

module.exports = router;
