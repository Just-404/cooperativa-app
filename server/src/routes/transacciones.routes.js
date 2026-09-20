const { Router } = require('express');
const controller = require('../controllers/transacciones.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/transacciones
router.get('/', auth, controller.listar);

module.exports = router;
