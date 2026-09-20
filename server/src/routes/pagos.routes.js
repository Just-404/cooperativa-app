const { Router } = require('express');
const controller = require('../controllers/pagos.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/pagos
router.get('/', auth, controller.listar);

module.exports = router;
