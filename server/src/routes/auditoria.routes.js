const { Router } = require('express');
const controller = require('../controllers/auditoria.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');

const router = Router();

router.get('/', auth, checkRole('administrador', 'auditor'), controller.listar);

module.exports = router;
