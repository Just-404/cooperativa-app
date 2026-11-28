const { sequelize, Prestamo, Socio, TipoPrestamo, Cuota } = require('../models');

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
  montoSolicitado = Number(montoSolicitado);
  plazoMeses = Number(plazoMeses);

  if (!Number.isFinite(montoSolicitado) || montoSolicitado <= 0) {
    const err = new Error('El monto solicitado debe ser mayor a cero');
    err.status = 400;
    throw err;
  }

  if (!Number.isInteger(plazoMeses) || plazoMeses < 1) {
    const err = new Error('El plazo debe ser al menos 1 mes');
    err.status = 400;
    throw err;
  }

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

async function revertirEstado(id) {
  return sequelize.transaction(async (transaction) => {
    const prestamo = await Prestamo.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!prestamo) {
      const err = new Error('Préstamo no encontrado');
      err.status = 404;
      throw err;
    }

    let cambios;
    if (prestamo.estado === 'evaluado') {
      cambios = {
        estado: 'solicitado',
        comentarioEvaluacion: null,
        fechaEvaluacion: null,
      };
    } else if (prestamo.estado === 'aprobado' || prestamo.estado === 'rechazado') {
      cambios = {
        estado: 'evaluado',
        montoAprobado: null,
        comentarioAprobacion: null,
        usuarioAprobadorId: null,
        fechaAprobacion: null,
      };
    } else {
      const err = new Error('Solo se puede revertir un préstamo antes del desembolso');
      err.status = 400;
      throw err;
    }

    await prestamo.update(cambios, { transaction });
    return prestamo;
  });
}

async function deshacerSolicitud(id) {
  return sequelize.transaction(async (transaction) => {
    const prestamo = await Prestamo.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!prestamo) {
      const err = new Error('Préstamo no encontrado');
      err.status = 404;
      throw err;
    }

    if (prestamo.estado !== 'solicitado') {
      const err = new Error('Solo se puede deshacer una solicitud pendiente de evaluación');
      err.status = 400;
      throw err;
    }

    if (Cuota) {
      const cuotas = await Cuota.count({
        where: { prestamoId: id },
        transaction,
      });
      if (cuotas > 0) {
        const err = new Error('No se puede deshacer una solicitud con cuotas registradas');
        err.status = 400;
        throw err;
      }
    }

    await prestamo.destroy({ transaction });
  });
}

module.exports = { listar, obtener, solicitar, revertirEstado, deshacerSolicitud };
