const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth.routes'));
router.use('/socios', require('./socios.routes'));
router.use('/cuentas', require('./cuentas.routes'));
router.use('/transacciones', require('./transacciones.routes')); // depósitos y retiros
router.use('/prestamos', require('./prestamos.routes'));
router.use('/evaluacion', require('./evaluacion.routes'));
router.use('/aprobacion', require('./aprobacion.routes'));
router.use('/desembolso', require('./desembolso.routes'));
router.use('/cuotas', require('./cuotas.routes'));
router.use('/pagos', require('./pagos.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/auditoria', require('./auditoria.routes'));
router.use('/reportes', require('./reportes.routes'));
router.use('/scoring', require('./scoring.routes'));

module.exports = router;
