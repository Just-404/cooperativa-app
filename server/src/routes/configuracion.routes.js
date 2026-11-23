const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/configuracion.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/roles.middleware');
const validate = require('../middlewares/validate.middleware');
const auditoria = require('../middlewares/auditoria.middleware');

const router = Router();

const lectura = checkRole('administrador', 'gerente');
const soloAdmin = checkRole('administrador');
const editaMora = checkRole('administrador', 'gerente');

const anioQuery = query('anio').optional({ values: 'falsy' })
  .isInt({ min: 2000, max: 2100 }).withMessage('Año inválido').toInt();
const fechaCrear = body('fecha').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha inválida (YYYY-MM-DD)');
const fechaActualizar = body('fecha').optional({ values: 'falsy' })
  .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha inválida (YYYY-MM-DD)');

router.get('/', auth, lectura, anioQuery, validate, controller.obtener);
router.get('/feriados', auth, lectura, anioQuery, validate, controller.listarFeriados);

router.post(
  '/feriados',
  auth, soloAdmin,
  [
    body('anio').isInt({ min: 2000, max: 2100 }).withMessage('Año inválido').toInt(),
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    fechaCrear,
  ],
  validate,
  auditoria('crear_feriado', 'feriado'),
  controller.crearFeriado
);

router.post(
  '/feriados/restaurar',
  auth, soloAdmin,
  [body('anio').isInt({ min: 2000, max: 2100 }).withMessage('Año inválido').toInt()],
  validate,
  auditoria('restaurar_feriados', 'feriado'),
  controller.restaurarFeriados
);

router.put(
  '/feriados/:id',
  auth, soloAdmin,
  [
    param('id').notEmpty().withMessage('ID requerido'),
    body('nombre').optional({ values: 'falsy' }).trim().notEmpty().withMessage('El nombre es requerido'),
    fechaActualizar,
    body('activo').optional({ values: 'falsy' }).isBoolean().withMessage('Activo debe ser booleano').toBoolean(),
  ],
  validate,
  auditoria('actualizar_feriado', 'feriado'),
  controller.actualizarFeriado
);

router.delete(
  '/feriados/:id',
  auth, soloAdmin,
  [param('id').notEmpty().withMessage('ID requerido')],
  validate,
  auditoria('eliminar_feriado', 'feriado'),
  controller.eliminarFeriado
);

router.put(
  '/dias-no-laborables',
  auth, soloAdmin,
  [
    body('diasNoLaborables').isArray({ min: 1, max: 6 }).withMessage('Debe enviar entre 1 y 6 días'),
    body('diasNoLaborables.*').isInt({ min: 0, max: 6 }).withMessage('Días válidos: 0 a 6').toInt(),
  ],
  validate,
  auditoria('actualizar_dias_no_laborables', 'configuracion'),
  controller.actualizarDiasNoLaborables
);

router.get('/mora', auth, editaMora, controller.listarTasas);
router.put(
  '/mora',
  auth, editaMora,
  [
    body('tasaMensual').isFloat({ min: 0, max: 20 }).withMessage('Tasa mensual inválida').toFloat(),
    body('vigenteDesde').optional({ values: 'falsy' }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha inválida'),
  ],
  validate,
  auditoria('actualizar_tasa_mora', 'tasa_mora'),
  controller.actualizarTasaMora
);

router.get('/recalcular-cuotas/preview', auth, soloAdmin, controller.previsualizarRecalculo);

router.post(
  '/recalcular-cuotas',
  auth, soloAdmin,
  auditoria('recalcular_fechas_global', 'cuota'),
  controller.recalcularCuotas
);

module.exports = router;
