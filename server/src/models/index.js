const sequelize = require('../config/db');

const Usuario = require('./Usuario');
const Socio = require('./Socio');
const CuentaAhorro = require('./CuentaAhorro');
const Transaccion = require('./Transaccion');
const TipoPrestamo = require('./TipoPrestamo');
const Prestamo = require('./Prestamo');
const Cuota = require('./Cuota');
const Pago = require('./Pago');
const Auditoria = require('./Auditoria');
const ScoringCrediticio = require('./ScoringCrediticio');

// Socio <-> CuentaAhorro
Socio.hasMany(CuentaAhorro, { foreignKey: 'socioId', as: 'cuentas' });
CuentaAhorro.belongsTo(Socio, { foreignKey: 'socioId', as: 'socio' });

// CuentaAhorro <-> Transaccion
CuentaAhorro.hasMany(Transaccion, { foreignKey: 'cuentaId', as: 'transacciones' });
Transaccion.belongsTo(CuentaAhorro, { foreignKey: 'cuentaId', as: 'cuenta' });
Transaccion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Socio <-> Prestamo
Socio.hasMany(Prestamo, { foreignKey: 'socioId', as: 'prestamos' });
Prestamo.belongsTo(Socio, { foreignKey: 'socioId', as: 'socio' });

// TipoPrestamo <-> Prestamo
TipoPrestamo.hasMany(Prestamo, { foreignKey: 'tipoPrestamoId', as: 'prestamos' });
Prestamo.belongsTo(TipoPrestamo, { foreignKey: 'tipoPrestamoId', as: 'tipoPrestamo' });

// Prestamo <-> Usuario (quien aprobó)
Prestamo.belongsTo(Usuario, { foreignKey: 'usuarioAprobadorId', as: 'aprobador' });

// Prestamo <-> Cuota
Prestamo.hasMany(Cuota, { foreignKey: 'prestamoId', as: 'cuotas' });
Cuota.belongsTo(Prestamo, { foreignKey: 'prestamoId', as: 'prestamo' });

// Cuota <-> Pago
Cuota.hasMany(Pago, { foreignKey: 'cuotaId', as: 'pagos' });
Pago.belongsTo(Cuota, { foreignKey: 'cuotaId', as: 'cuota' });
Pago.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Usuario <-> Auditoria
Usuario.hasMany(Auditoria, { foreignKey: 'usuarioId', as: 'auditorias' });
Auditoria.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Socio <-> ScoringCrediticio (historial de evaluaciones)
Socio.hasMany(ScoringCrediticio, { foreignKey: 'socioId', as: 'scoring' });
ScoringCrediticio.belongsTo(Socio, { foreignKey: 'socioId', as: 'socio' });

module.exports = {
  sequelize,
  Usuario,
  Socio,
  CuentaAhorro,
  Transaccion,
  TipoPrestamo,
  Prestamo,
  Cuota,
  Pago,
  Auditoria,
  ScoringCrediticio,
};
