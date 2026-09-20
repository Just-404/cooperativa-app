const { Router } = require('express');
const controller = require('../controllers/reportes.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/reportes
router.get('/', auth, controller.listar);

module.exports = router;
