const { Router } = require('express');
const controller = require('../controllers/socios.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/socios
router.get('/', auth, controller.listar);

module.exports = router;
