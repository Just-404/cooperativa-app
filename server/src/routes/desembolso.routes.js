const { Router } = require('express');
const controller = require('../controllers/desembolso.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/desembolso
router.get('/', auth, controller.listar);

module.exports = router;
