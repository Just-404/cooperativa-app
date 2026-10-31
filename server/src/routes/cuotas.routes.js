const { Router } = require('express');
const controller = require('../controllers/cuotas.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

router.get('/prestamo/:prestamoId', auth, controller.listarPorPrestamo);

router.post(
  '/prestamo/:prestamoId/recalcular-fechas',
  auth, checkRole('administrador', 'gerente', 'cajero'),
  auditoria('recalcular_fechas_cuotas', 'cuota'),
  controller.recalcularFechasCuotas
);

module.exports = router;
