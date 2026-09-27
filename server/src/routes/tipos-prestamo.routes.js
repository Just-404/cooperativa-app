const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/tipos-prestamo.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');

const router = Router();

router.get('/', auth, controller.listar);

router.post(
  '/',
  auth, checkRole('administrador'),
  [
    body('nombre').notEmpty(),
    body('tasaInteresAnual').isFloat({ gt: 0 }),
    body('plazoMaximoMeses').isInt({ min: 1 }),
    body('montoMaximo').isFloat({ gt: 0 }),
  ],
  validate,
  controller.crear
);

module.exports = router;
