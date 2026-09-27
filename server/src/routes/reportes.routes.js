const { Router } = require('express');
const controller = require('../controllers/reportes.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');

const router = Router();
const puedeVerDetalle = checkRole('administrador', 'gerente', 'auditor');

router.get('/resumen', auth, controller.resumen);
router.get('/prestamos-por-estado', auth, puedeVerDetalle, controller.prestamosPorEstado);

module.exports = router;
