const { Router } = require('express');
const controller = require('../controllers/cuentas.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/cuentas
router.get('/', auth, controller.listar);

module.exports = router;
