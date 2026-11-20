jest.mock('../models', () => ({
  Socio: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  ScoringCrediticio: {},
  CuentaAhorro: {},
  sequelize: {},
}));

const { Socio } = require('../models');
const { crear, actualizar } = require('./socios.service');

describe('validación de cédula duplicada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve un error comprensible al registrar una cédula duplicada', async () => {
    Socio.create.mockRejectedValue({
      name: 'SequelizeUniqueConstraintError',
      errors: [{ path: 'documento' }],
    });

    await expect(crear({ documento: '001-1234567-8' })).rejects.toMatchObject({
      status: 409,
      message: 'La cédula ingresada ya está registrada para otro socio. Verifica el número e intenta nuevamente.',
    });
  });

  it('devuelve un error comprensible al cambiar a una cédula duplicada', async () => {
    const socio = { estado: 'activo', update: jest.fn().mockRejectedValue({
      name: 'SequelizeUniqueConstraintError',
      parent: { constraint: 'socios_documento_key120' },
    }) };
    Socio.findByPk.mockResolvedValue(socio);

    await expect(actualizar('socio-id', {
      documento: '001-1234567-8',
    })).rejects.toMatchObject({
      status: 409,
      message: 'La cédula ingresada ya está registrada para otro socio. Verifica el número e intenta nuevamente.',
    });
  });

  it('no modifica otros errores de unicidad', async () => {
    const error = {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ path: 'email' }],
    };
    Socio.create.mockRejectedValue(error);

    await expect(crear({ documento: '001-1234567-8' })).rejects.toBe(error);
  });
});
