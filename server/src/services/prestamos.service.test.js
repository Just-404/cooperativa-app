jest.mock('../models', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
  Prestamo: {
    findByPk: jest.fn(),
  },
  Socio: {},
  TipoPrestamo: {},
}));

const { sequelize, Prestamo } = require('../models');
const { revertirEstado } = require('./prestamos.service');

const transaction = { LOCK: { UPDATE: 'UPDATE' } };

function prestamoEnEstado(estado) {
  const prestamo = {
    estado,
    update: jest.fn(async (cambios) => {
      Object.assign(prestamo, cambios);
      return prestamo;
    }),
  };
  return prestamo;
}

describe('revertir estado de préstamo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation((callback) => callback(transaction));
  });

  it('devuelve una evaluación a solicitud y limpia sus datos', async () => {
    const prestamo = prestamoEnEstado('evaluado');
    Prestamo.findByPk.mockResolvedValue(prestamo);

    await revertirEstado('prestamo-1');

    expect(Prestamo.findByPk).toHaveBeenCalledWith('prestamo-1', {
      transaction,
      lock: 'UPDATE',
    });
    expect(prestamo.update).toHaveBeenCalledWith({
      estado: 'solicitado',
      comentarioEvaluacion: null,
      fechaEvaluacion: null,
    }, { transaction });
  });

  it.each(['aprobado', 'rechazado'])('devuelve %s a evaluación y limpia la decisión', async (estado) => {
    const prestamo = prestamoEnEstado(estado);
    Prestamo.findByPk.mockResolvedValue(prestamo);

    await revertirEstado('prestamo-1');

    expect(prestamo.update).toHaveBeenCalledWith({
      estado: 'evaluado',
      montoAprobado: null,
      comentarioAprobacion: null,
      usuarioAprobadorId: null,
      fechaAprobacion: null,
    }, { transaction });
  });

  it.each(['solicitado', 'desembolsado', 'cerrado'])('rechaza la reversión desde %s', async (estado) => {
    const prestamo = prestamoEnEstado(estado);
    Prestamo.findByPk.mockResolvedValue(prestamo);

    await expect(revertirEstado('prestamo-1')).rejects.toMatchObject({ status: 400 });
    expect(prestamo.update).not.toHaveBeenCalled();
  });
});
