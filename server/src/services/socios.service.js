const { Socio, ScoringCrediticio } = require('../models');

async function listar() {
  const lista = await Socio.findAll({ order: [['createdAt', 'DESC']] });

  const evaluaciones = await ScoringCrediticio.findAll({
    attributes: ['socioId', 'puntaje'],
    order: [['fechaEvaluacion', 'DESC']],
    raw: true,
  });

  const ultimo = new Map();
  for (const e of evaluaciones) {
    if (!ultimo.has(e.socioId)) ultimo.set(e.socioId, e.puntaje);
  }

  return lista.map((s) => ({
    ...s.toJSON(),
    scoring: ultimo.get(s.id) ?? null,
  }));

}

async function obtener(id) {
  const socio = await Socio.findByPk(id, {
    include: ['cuentas', 'prestamos'],
  });
  if (!socio) {
    const err = new Error('Socio no encontrado');
    err.status = 404;
    throw err;
  }
  return socio;
}

async function crear(datos) {
  return Socio.create(datos);
}

async function actualizar(id, datos) {
  const socio = await obtener(id);
  return socio.update(datos);
}

async function eliminar(id) {
  const socio = await obtener(id);
  await socio.destroy();

  return {
    mensaje: 'Socio eliminado correctamente',
    id: socio.id,
  };
}

async function cambiarEstado(id, estado) {
  const socio = await obtener(id);
  return socio.update({ estado });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, cambiarEstado };
