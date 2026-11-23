jest.mock('../models', () => ({
  CuentaAhorro: { findByPk: jest.fn(), findAll: jest.fn() },
  Cuota: { findByPk: jest.fn(), findAll: jest.fn() },
  Pago: { findByPk: jest.fn(), findAll: jest.fn() },
  Prestamo: { findByPk: jest.fn(), findAll: jest.fn() },
  ScoringCrediticio: { findByPk: jest.fn(), findAll: jest.fn() },
  Socio: { findByPk: jest.fn(), findAll: jest.fn() },
  Transaccion: { findByPk: jest.fn(), findAll: jest.fn() },
  Usuario: { findByPk: jest.fn(), findAll: jest.fn() },
  Ticket: { findByPk: jest.fn(), findAll: jest.fn() },
  TipoPrestamo: { findByPk: jest.fn(), findAll: jest.fn() },
  Feriado: { findByPk: jest.fn(), findAll: jest.fn() },
  Configuracion: { findByPk: jest.fn(), findAll: jest.fn() },
  TasaMora: { findByPk: jest.fn(), findAll: jest.fn() },
}));
jest.mock('../services/auditoria.service', () => ({
  registrar: jest.fn().mockResolvedValue(undefined),
}));

const modelos = require('../models');
const auditoriaService = require('../services/auditoria.service');
const auditoria = require('./auditoria.middleware');

function crearRespuesta(statusCode = 200) {
  const listeners = {};
  return {
    statusCode,
    json: jest.fn((cuerpo) => cuerpo),
    once: (evento, callback) => { listeners[evento] = callback; },
    terminar: () => listeners.finish(),
  };
}

async function esperarOperacionesPendientes() {
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('registra snapshots antes/después de una actualización y excluye credenciales', async () => {
  modelos.Usuario.findByPk
    .mockResolvedValueOnce({ id: 'usuario-1', nombre: 'Antes', rol: 'administrador' })
    .mockResolvedValueOnce({ id: 'usuario-1', nombre: 'Después', rol: 'administrador' });
  const req = {
    method: 'PUT',
    params: { id: 'usuario-1' },
    body: { nombre: 'Después', password: 'no-registrar' },
    user: { id: 'admin-1' },
  };
  const res = crearRespuesta();
  const next = jest.fn();

  auditoria('actualizar_usuario', 'usuario')(req, res, next);
  await esperarOperacionesPendientes();
  res.json({ id: 'usuario-1', nombre: 'Después' });
  res.terminar();
  await esperarOperacionesPendientes();

  const evento = auditoriaService.registrar.mock.calls[0][0];
  const detalle = JSON.parse(evento.detalle);
  expect(evento.entidadId).toBe('usuario-1');
  expect(detalle).toMatchObject({
    operacion: 'actualizar',
    antes: { nombre: 'Antes' },
    despues: { nombre: 'Después' },
    datos: { nombre: 'Después' },
  });
  expect(detalle.datos).not.toHaveProperty('password');
});

test('registra el snapshot de una inserción y su entidad inferida', async () => {
  modelos.Usuario.findByPk.mockResolvedValueOnce({
    id: 'usuario-2',
    nombre: 'Nuevo',
    password: 'hash-privado',
  });
  const req = {
    method: 'POST',
    params: {},
    body: { nombre: 'Nuevo', password: 'secreto' },
    user: { id: 'admin-1' },
  };
  const res = crearRespuesta(201);
  const next = jest.fn();

  auditoria('crear_usuario')(req, res, next);
  await esperarOperacionesPendientes();
  res.json({ id: 'usuario-2', nombre: 'Nuevo' });
  res.terminar();
  await esperarOperacionesPendientes();

  const evento = auditoriaService.registrar.mock.calls[0][0];
  const detalle = JSON.parse(evento.detalle);
  expect(evento.entidad).toBe('usuario');
  expect(detalle.operacion).toBe('insertar');
  expect(detalle.antes).toBeNull();
  expect(detalle.despues).toMatchObject({ id: 'usuario-2', nombre: 'Nuevo' });
  expect(detalle.despues).not.toHaveProperty('password');
});

test('registra el saldo de la cuenta antes y después de un depósito', async () => {
  modelos.CuentaAhorro.findByPk
    .mockResolvedValueOnce({ id: 'cuenta-1', socioId: 'socio-1', saldo: '100.00', estado: 'activa' })
    .mockResolvedValueOnce({ id: 'cuenta-1', socioId: 'socio-1', saldo: '150.00', estado: 'activa' });
  modelos.Socio.findByPk.mockResolvedValueOnce({
    id: 'socio-1',
    nombre: 'María',
    apellido: 'Pérez',
  });
  modelos.Transaccion.findByPk.mockResolvedValueOnce({
    id: 'transaccion-1',
    tipo: 'deposito',
    monto: '50.00',
    saldoResultante: '150.00',
  });
  const req = {
    method: 'POST',
    params: {},
    body: { cuentaId: 'cuenta-1', monto: 50 },
    user: { id: 'cajero-1' },
  };
  const res = crearRespuesta(201);

  auditoria('deposito', 'transaccion')(req, res, jest.fn());
  await esperarOperacionesPendientes();
  res.json({ id: 'transaccion-1' });
  res.terminar();
  await esperarOperacionesPendientes();

  const detalle = JSON.parse(auditoriaService.registrar.mock.calls[0][0].detalle);
  expect(detalle.operacion).toBe('actualizar');
  expect(detalle.antes).toMatchObject({ socioId: 'socio-1', saldo: '100.00' });
  expect(detalle.despues).toMatchObject({ socioId: 'socio-1', saldo: '150.00' });
  expect(detalle.movimiento).toMatchObject({
    tipo: 'deposito',
    monto: '50.00',
    saldoResultante: '150.00',
  });
  expect(detalle.cambiosRelacionados).toBeUndefined();
  expect(detalle.afectado).toBe('María Pérez');
});

test('mantiene el estado anterior en una eliminación y marca el posterior como eliminado', async () => {
  modelos.Socio.findByPk.mockResolvedValueOnce({
    id: 'socio-1',
    nombre: 'Socio',
    documento: '123',
  });
  const req = {
    method: 'DELETE',
    params: { id: 'socio-1' },
    body: {},
    user: { id: 'admin-1' },
  };
  const res = crearRespuesta();
  const next = jest.fn();

  auditoria('eliminar_socio')(req, res, next);
  await esperarOperacionesPendientes();
  res.json({ mensaje: 'Eliminado', id: 'socio-1' });
  res.terminar();
  await esperarOperacionesPendientes();

  const evento = auditoriaService.registrar.mock.calls[0][0];
  const detalle = JSON.parse(evento.detalle);
  expect(detalle.operacion).toBe('eliminar');
  expect(detalle.antes).toMatchObject({ nombre: 'Socio' });
  expect(detalle.despues).toBeNull();
});

test('audita la restauración de feriados usando el año como identificador', async () => {
  modelos.Feriado.findAll
    .mockResolvedValueOnce([{ id: 'feriado-1', anio: 2026, nombre: 'Año Nuevo' }])
    .mockResolvedValueOnce([
      { id: 'feriado-1', anio: 2026, nombre: 'Año Nuevo' },
      { id: 'feriado-2', anio: 2026, nombre: 'Independencia' },
    ]);
  const req = {
    method: 'POST',
    params: {},
    body: { anio: 2026 },
    user: { id: 'admin-1' },
  };
  const res = crearRespuesta();
  const next = jest.fn();

  auditoria('restaurar_feriados', 'feriado')(req, res, next);
  await esperarOperacionesPendientes();
  res.json({ anio: 2026, restaurados: 2 });
  res.terminar();
  await esperarOperacionesPendientes();

  const evento = auditoriaService.registrar.mock.calls[0][0];
  const detalle = JSON.parse(evento.detalle);
  expect(evento.entidadId).toBe('2026');
  expect(detalle.operacion).toBe('actualizar');
  expect(detalle.antes).toHaveLength(1);
  expect(detalle.despues).toHaveLength(2);
});
