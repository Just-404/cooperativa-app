jest.mock('../models', () => ({
  Cuota: {
    findAll: jest.fn(),
  },
  Prestamo: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../utils/feriados', () => ({
  aISO: jest.fn(),
  calcularFechaVencimiento: jest.fn(),
  calendarioPorDefecto: {},
}));

const { Cuota, Prestamo } = require('../models');
const { recalcularFechasCuotas } = require('./cuotas.service');

describe('recalcular fechas de cuotas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no recalcula las fechas de un préstamo cerrado', async () => {
    Prestamo.findByPk.mockResolvedValue({ estado: 'cerrado' });

    await expect(recalcularFechasCuotas('prestamo-1')).rejects.toMatchObject({
      status: 400,
      message: 'Solo se pueden recalcular fechas de préstamos desembolsados y no cerrados',
    });
    expect(Cuota.findAll).not.toHaveBeenCalled();
  });
});
