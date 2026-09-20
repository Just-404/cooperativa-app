const { Router } = require('express');
const controller = require('../controllers/cuotas.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/cuotas
router.get('/', auth, controller.listar);

module.exports = router;
