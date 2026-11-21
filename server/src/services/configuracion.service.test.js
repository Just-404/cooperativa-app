jest.mock('../models', () => ({
  sequelize: {},
  Configuracion: {
    findOrCreate: jest.fn().mockResolvedValue([{}, true]),
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      diasNoLaborables: [0, 6],
      calendarioDesactualizado: false,
    }),
    update: jest.fn().mockResolvedValue([1]),
  },
  Feriado: {
    findAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(1),
    bulkCreate: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  },
  TasaMora: {
    findOrCreate: jest.fn().mockResolvedValue([{}, true]),
    findAll: jest.fn(),
    upsert: jest.fn(),
  },
  Prestamo: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  Usuario: {
    findAll: jest.fn(),
  },
}));

jest.mock('./cuotas.service', () => ({
  recalcularFechasCuotas: jest.fn().mockResolvedValue({ cuotasActualizadas: 0, cambios: [] }),
}));

const { TasaMora, Usuario } = require('../models');
const configuracion = require('./configuracion.service');

describe('servicio de configuración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TasaMora.findAll.mockResolvedValue([{
      id: 'tasa-1',
      tasaDiaria: 0.001,
      vigenteDesde: '2000-01-01',
      creadoPorId: 'usuario-1',
    }]);
    Usuario.findAll.mockResolvedValue([{ id: 'usuario-1', nombre: 'Admin' }]);
  });

  test('obtiene la configuración sin consultar el apellido de los usuarios', async () => {
    const datos = await configuracion.obtenerConfiguracion(2026);

    expect(Usuario.findAll).toHaveBeenCalledWith({
      where: { id: ['usuario-1'] },
      attributes: ['id', 'nombre'],
    });
    expect(datos.mora.historial[0].creadoPor).toBe('Admin');
  });

  test('lista las tasas sin consultar el apellido de los usuarios', async () => {
    const tasas = await configuracion.listarTasas();

    expect(Usuario.findAll).toHaveBeenCalledWith({
      where: { id: ['usuario-1'] },
      attributes: ['id', 'nombre'],
    });
    expect(tasas[0].creadoPor).toBe('Admin');
  });
});
