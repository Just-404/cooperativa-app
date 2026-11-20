const errorHandler = require('./error.middleware');

function respuestaFalsa() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('errorHandler', () => {
  it('responde con los mensajes específicos de validación sin el prefijo de Sequelize', () => {
    const res = respuestaFalsa();

    errorHandler({
      name: 'SequelizeValidationError',
      message: 'Validation error: Formato de cédula dominicana inválido',
      errors: [{ message: 'Formato de cédula dominicana inválido' }],
    }, {}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Formato de cédula dominicana inválido' },
    });
  });

  it('quita el prefijo si Sequelize no proporciona detalles individuales', () => {
    const res = respuestaFalsa();

    errorHandler({ message: 'Validation error: Email inválido' }, {}, res);

    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Email inválido' },
    });
  });

  it('mantiene los mensajes de errores que no son de validación', () => {
    const res = respuestaFalsa();

    errorHandler({ status: 409, message: 'La cédula ya está registrada' }, {}, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'La cédula ya está registrada' },
    });
  });
});
