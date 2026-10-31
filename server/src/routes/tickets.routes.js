const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/tickets.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');

const router = Router();

// Rutas públicas - Para que usuarios generen tickets
router.post(
  '/',
  [
    auth,
    body('tipo').isIn(['forgot_password', 'report_problem']).withMessage('Tipo de ticket inválido'),
    body('titulo').trim().notEmpty().withMessage('El título es requerido'),
    body('descripcion').trim().notEmpty().withMessage('La descripción es requerida'),
  ],
  controller.crearTicket
);

// Rutas para administrador - Ver y resolver tickets
router.get(
  '/',
  auth,
  checkRole('administrador'),
  controller.listarTickets
);

router.get(
  '/:id',
  auth,
  checkRole('administrador'),
  [param('id').isUUID().withMessage('ID de ticket inválido')],
  controller.obtenerTicket
);

router.patch(
  '/:id',
  auth,
  checkRole('administrador'),
  [
    param('id').isUUID().withMessage('ID de ticket inválido'),
    body('estado').isIn(['pending', 'resolved', 'cancelled']).withMessage('Estado inválido'),
  ],
  controller.actualizarTicket
);

router.delete(
  '/:id',
  auth,
  checkRole('administrador'),
  [param('id').isUUID().withMessage('ID de ticket inválido')],
  controller.eliminarTicket
);

module.exports = router;