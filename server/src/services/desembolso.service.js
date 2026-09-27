const { sequelize } = require('../models');
const prestamosService = require('./prestamos.service');
const cuotasService = require('./cuotas.service');

async function desembolsar(prestamoId) {
  const prestamo = await prestamosService.obtener(prestamoId);

  if (prestamo.estado !== 'aprobado') {
    const err = new Error('Solo se puede desembolsar un préstamo aprobado');
    err.status = 400;
    throw err;
  }

  return sequelize.transaction(async (t) => {
    await prestamo.update(
      { estado: 'desembolsado', fechaDesembolso: new Date() },
      { transaction: t }
    );
    await cuotasService.generarCuotas(prestamo, { transaction: t });
    return prestamo;
  });
}

module.exports = { desembolsar };
