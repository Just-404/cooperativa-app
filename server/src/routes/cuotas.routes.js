const { Router } = require('express');
const controller = require('../controllers/cuotas.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

router.get('/prestamo/:prestamoId', auth, controller.listarPorPrestamo);

module.exports = router;
