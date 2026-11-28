jest.mock('../models', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
  Cuota: {
    findAll: jest.fn(),
    count: jest.fn(),
  },
  Pago: {
    create: jest.fn(),
  },
  Prestamo: {
    findByPk: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../utils/feriados', () => ({
  aISO: jest.fn(),
  diferenciaDias: jest.fn(),
}));

jest.mock('../utils/mora', () => ({
  calcularMontoMora: jest.fn(),
  round6: jest.fn(),
}));

jest.mock('./configuracion.service', () => ({
  resolverTasaParaFecha: jest.fn(),
}));

const { sequelize, Cuota, Pago, Prestamo } = require('../models');
const { registrarAbonoCapital } = require('./pagos.service');

describe('abono a capital', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((callback) => callback({
      LOCK: { UPDATE: 'UPDATE' },
    }));
  });

  it('rechaza abonos sobre un préstamo cerrado', async () => {
    Prestamo.findByPk.mockResolvedValue({ estado: 'cerrado' });

    await expect(registrarAbonoCapital('prestamo-1', 100, 'usuario-1')).rejects.toMatchObject({
      status: 400,
      message: 'Solo se puede abonar capital a préstamos desembolsados y no cerrados',
    });
    expect(Cuota.findAll).not.toHaveBeenCalled();
    expect(Pago.create).not.toHaveBeenCalled();
  });
});
