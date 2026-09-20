const { Router } = require('express');
const controller = require('../controllers/usuarios.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/usuarios
router.get('/', auth, controller.listar);

module.exports = router;
