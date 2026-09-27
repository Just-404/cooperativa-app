const { Prestamo, Socio, TipoPrestamo } = require('../models');

async function listar() {
  return Prestamo.findAll({
    include: ['socio', 'tipoPrestamo'],
    order: [['fechaSolicitud', 'DESC']],
  });
}

async function obtener(id) {
  const prestamo = await Prestamo.findByPk(id, {
    include: ['socio', 'tipoPrestamo', 'aprobador', 'cuotas'],
  });
  if (!prestamo) {
    const err = new Error('Préstamo no encontrado');
    err.status = 404;
    throw err;
  }
  return prestamo;
}

async function solicitar({ socioId, tipoPrestamoId, montoSolicitado, plazoMeses }) {
  const socio = await Socio.findByPk(socioId);
  if (!socio || socio.estado !== 'activo') {
    const err = new Error('Socio no encontrado o inactivo');
    err.status = 404;
    throw err;
  }

  const tipo = await TipoPrestamo.findByPk(tipoPrestamoId);
  if (!tipo) {
    const err = new Error('Tipo de préstamo no encontrado');
    err.status = 404;
    throw err;
  }

  if (montoSolicitado < Number(tipo.montoMinimo) || montoSolicitado > Number(tipo.montoMaximo)) {
    const err = new Error(
      `El monto debe estar entre ${tipo.montoMinimo} y ${tipo.montoMaximo} para este tipo de préstamo`
    );
    err.status = 400;
    throw err;
  }

  if (plazoMeses > tipo.plazoMaximoMeses) {
    const err = new Error(`El plazo máximo para este tipo de préstamo es de ${tipo.plazoMaximoMeses} meses`);
    err.status = 400;
    throw err;
  }

  return Prestamo.create({
    socioId,
    tipoPrestamoId,
    montoSolicitado,
    plazoMeses,
    tasaInteresAnual: tipo.tasaInteresAnual,
    estado: 'solicitado',
  });
}

module.exports = { listar, obtener, solicitar };
