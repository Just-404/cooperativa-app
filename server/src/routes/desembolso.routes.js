const { Router } = require('express');
const controller = require('../controllers/desembolso.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

router.post(
  '/:id/desembolsar',
  auth, checkRole('administrador', 'cajero'),
  auditoria('desembolsar_prestamo'),
  controller.desembolsar
);

module.exports = router;
