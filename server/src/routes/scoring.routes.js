const { Router } = require('express');
const controller = require('../controllers/scoring.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();
const puedeEvaluar = checkRole('administrador', 'oficial_credito', 'cajero');

router.get('/socio/:socioId', auth, controller.obtenerPorSocio);
router.post('/socio/:socioId/calcular', auth, puedeEvaluar, auditoria('calcular_scoring', 'scoring'), controller.calcular);

module.exports = router;
