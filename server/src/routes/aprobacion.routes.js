const { Router } = require('express');
const controller = require('../controllers/aprobacion.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/aprobacion
router.get('/', auth, controller.listar);

module.exports = router;
