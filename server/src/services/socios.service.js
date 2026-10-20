const { Socio, ScoringCrediticio, CuentaAhorro, sequelize } = require('../models');

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
  const socio = await Socio.findByPk(id);
  if (!socio) {
    const err = new Error('Socio no encontrado');
    err.status = 404;
    throw err;
  }

  const camposEditables = [
    'nombre',
    'apellido',
    'documento',
    'email',
    'telefono',
    'direccion',
    'fechaNacimiento',
  ];
  const cambios = Object.fromEntries(
    camposEditables
      .filter((campo) => datos[campo] !== undefined)
      .map((campo) => [campo, datos[campo]])
  );
  return socio.update(cambios);
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
  return sequelize.transaction(async (transaction) => {
    const socio = await Socio.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!socio) {
      const err = new Error('Socio no encontrado');
      err.status = 404;
      throw err;
    }
    if (socio.estado === estado) return socio;

    await socio.update({ estado }, { transaction });
    if (estado === 'inactivo') {
      await CuentaAhorro.update(
        { estado: 'inactiva' },
        { where: { socioId: id, estado: 'activa' }, transaction }
      );
    } else {
      await CuentaAhorro.update(
        { estado: 'activa' },
        { where: { socioId: id, estado: 'inactiva' }, transaction }
      );
    }
    return socio;
  });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, cambiarEstado };
