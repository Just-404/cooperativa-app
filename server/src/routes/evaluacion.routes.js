const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/evaluacion.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

router.post(
  '/:id/evaluar',
  auth, checkRole('administrador', 'oficial_credito'),
  [body('comentario').notEmpty().withMessage('El comentario de evaluación es requerido')],
  validate,
  auditoria('evaluar_prestamo'),
  controller.evaluar
);

module.exports = router;
