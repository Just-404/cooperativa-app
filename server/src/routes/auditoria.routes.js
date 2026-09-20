const { Router } = require('express');
const controller = require('../controllers/auditoria.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

// GET /api/auditoria
router.get('/', auth, controller.listar);

module.exports = router;
