const { Router } = require('express');
const controller = require('../controllers/prestamos.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/prestamos
router.get('/', auth, controller.listar);

module.exports = router;
