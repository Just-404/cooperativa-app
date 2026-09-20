const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  controller.login
);

module.exports = router;
