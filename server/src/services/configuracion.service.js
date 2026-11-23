const { sequelize, Configuracion, Feriado, TasaMora, Prestamo, Usuario } = require('../models');
const {
  aISO,
  calendarioPorDefecto,
  crearCalendarioDesdeConfiguracion,
  generarFeriadosOficialesDetallados,
} = require('../utils/feriados');
const {
  FECHA_INICIAL_TASA,
  TASA_MORA_INICIAL_DIARIA,
  resolverTasaMora,
  round6,
  tasaDiariaAMensual,
  tasaMensualADiaria,
} = require('../utils/mora');
const { recalcularFechasCuotas } = require('./cuotas.service');

const CONFIG_ID = 1;

let cache = null;

function errorConEstado(mensaje, status) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

function esAnioValido(anio) {
  const numero = Number(anio);
  return Number.isInteger(numero) && numero >= 2000 && numero <= 2100;
}

function validarDiasNoLaborables(dias) {
  if (!Array.isArray(dias)) throw errorConEstado('diasNoLaborables debe ser un arreglo', 400);
  const numero = dias.map(Number);
  if (numero.some((dia) => !Number.isInteger(dia) || dia < 0 || dia > 6)) {
    throw errorConEstado('Los días deben estar entre 0 (domingo) y 6 (sábado)', 400);
  }
  if (new Set(numero).size !== numero.length) {
    throw errorConEstado('No se pueden repetir días de la semana', 400);
  }
  if (numero.length === 7) {
    throw errorConEstado('Debe quedar al menos un día laborable', 400);
  }
  return numero;
}

function feriadoPlano(feriado) {
  if (!feriado) return null;
  const plano = typeof feriado.get === 'function' ? feriado.get({ plain: true }) : feriado;
  return {
    id: plano.id,
    anio: plano.anio,
    nombre: plano.nombre,
    fecha: aISO(plano.fecha),
    fechaOriginal: plano.fechaOriginal ? aISO(plano.fechaOriginal) : null,
    origen: plano.origen,
    movible: Boolean(plano.movible),
    tipo: plano.tipo,
    activo: plano.activo !== false,
  };
}

function tasaPlana(tasa, usuarioNombre = null) {
  if (!tasa) return null;
  const plano = typeof tasa.get === 'function' ? tasa.get({ plain: true }) : tasa;
  const tasaDiaria = round6(plano.tasaDiaria);
  return {
    id: plano.id,
    tasaDiaria,
    tasaMensual: tasaDiariaAMensual(tasaDiaria),
    vigenteDesde: aISO(plano.vigenteDesde),
    creadoPorId: plano.creadoPorId,
    creadoPor: usuarioNombre,
  };
}

async function nombresDeUsuarios(ids) {
  const idsValidos = [...new Set(ids.filter(Boolean))];
  if (idsValidos.length === 0) return new Map();

  const usuarios = await Usuario.findAll({
    where: { id: idsValidos },
    attributes: ['id', 'nombre'],
  });
  return new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre]));
}

async function recargarCache() {
  const [configuracion, feriados, tasas] = await Promise.all([
    Configuracion.findByPk(CONFIG_ID),
    Feriado.findAll({ order: [['fecha', 'ASC']] }),
    TasaMora.findAll({ order: [['vigenteDesde', 'ASC']] }),
  ]);

  const diasNoLaborables = configuracion?.diasNoLaborables || [0, 6];

  cache = {
    feriados,
    tasas,
    diasNoLaborables,
    calendarioDesactualizado: Boolean(configuracion?.calendarioDesactualizado),
    calendario: crearCalendarioDesdeConfiguracion({ feriados, diasNoLaborables }),
  };
  return cache;
}

async function inicializar() {
  await Configuracion.findOrCreate({
    where: { id: CONFIG_ID },
    defaults: { id: CONFIG_ID, diasNoLaborables: [0, 6], calendarioDesactualizado: false },
  });

  await TasaMora.findOrCreate({
    where: { vigenteDesde: FECHA_INICIAL_TASA },
    defaults: { tasaDiaria: TASA_MORA_INICIAL_DIARIA, vigenteDesde: FECHA_INICIAL_TASA },
  });

  await asegurarFeriadosDeAnio(new Date().getFullYear());
  await recargarCache();
  return cache;
}

function asegurarCache() {
  if (!cache) throw errorConEstado('La configuración aún no fue inicializada', 503);
  return cache;
}

async function asegurarFeriadosDeAnio(anio) {
  if (!esAnioValido(anio)) throw errorConEstado('Año inválido', 400);

  const oficiales = await Feriado.count({ where: { anio, origen: 'oficial' } });
  if (oficiales > 0) return;

  const personalizados = await Feriado.findAll({ where: { anio, origen: 'personalizado' }, attributes: ['fecha'] });
  const fechasOcupadas = new Set(personalizados.map((f) => aISO(f.fecha)));

  const filas = generarFeriadosOficialesDetallados(anio)
    .filter((feriado) => !fechasOcupadas.has(feriado.fecha))
    .map((feriado) => ({
      anio,
      nombre: feriado.nombre,
      fecha: feriado.fecha,
      fechaOriginal: feriado.fechaOriginal,
      origen: 'oficial',
      movible: feriado.movible,
      tipo: feriado.tipo,
      activo: true,
    }));

  // El 31/dic se mantiene como fecha no laborable por defecto, pero como
  // entrada personalizada: el administrador puede editarla o eliminarla.
  const finDeAnio = `${anio}-12-31`;
  if (!fechasOcupadas.has(finDeAnio) && !filas.some((f) => f.fecha === finDeAnio)) {
    filas.push({
      anio,
      nombre: 'Fin de año (no laborable)',
      fecha: finDeAnio,
      fechaOriginal: null,
      origen: 'personalizado',
      movible: false,
      tipo: 'personalizado',
      activo: true,
    });
  }

  await Feriado.bulkCreate(filas, { ignoreDuplicates: true });
  await recargarCache();
}

async function marcarCalendarioDesactualizado(usuarioId) {
  await Configuracion.update(
    { calendarioDesactualizado: true, actualizadoPorId: usuarioId || null },
    { where: { id: CONFIG_ID } }
  );
  await recargarCache();
}

async function obtenerConfiguracion(anio) {
  await inicializar();
  const anioConsultado = esAnioValido(anio) ? Number(anio) : new Date().getFullYear();
  await asegurarFeriadosDeAnio(anioConsultado);

  const estado = asegurarCache();
  const feriados = estado.feriados.filter((f) => f.anio === anioConsultado);
  const tasas = estado.tasas;
  const nombres = await nombresDeUsuarios(tasas.map((tasa) => tasa.creadoPorId));
  const tasaActual = resolverTasaMora(tasas, aISO(new Date())) || {
    tasaDiaria: TASA_MORA_INICIAL_DIARIA,
    vigenteDesde: FECHA_INICIAL_TASA,
  };

  return {
    anio: anioConsultado,
    diasNoLaborables: estado.diasNoLaborables,
    calendarioDesactualizado: estado.calendarioDesactualizado,
    feriados: feriados.map(feriadoPlano),
    mora: {
      ...tasaPlana(tasaActual, nombres.get(tasaActual.creadoPorId)),
      historial: tasas.map((tasa) => tasaPlana(tasa, nombres.get(tasa.creadoPorId))),
    },
  };
}

async function listarFeriados(anio) {
  await inicializar();
  const anioConsultado = esAnioValido(anio) ? Number(anio) : new Date().getFullYear();
  await asegurarFeriadosDeAnio(anioConsultado);
  return asegurarCache().feriados
    .filter((f) => f.anio === anioConsultado)
    .map(feriadoPlano);
}

async function verificarFechaDisponible(anio, fecha, idExcluido = null) {
  const feriado = await Feriado.findOne({ where: { anio, fecha } });
  if (feriado && feriado.id !== idExcluido) {
    throw errorConEstado('Ya existe un feriado o fecha no laborable en esa fecha', 409);
  }
}

async function crearFeriado(datos, usuarioId) {
  await inicializar();
  const anio = Number(datos.anio);
  const fecha = aISO(datos.fecha);
  if (!esAnioValido(anio) || !fecha || Number(fecha.slice(0, 4)) !== anio) {
    throw errorConEstado('La fecha debe corresponder al año indicado', 400);
  }
  if (!String(datos.nombre || '').trim()) throw errorConEstado('El nombre es obligatorio', 400);

  await verificarFechaDisponible(anio, fecha);
  const feriado = await Feriado.create({
    anio,
    nombre: String(datos.nombre).trim(),
    fecha,
    fechaOriginal: null,
    origen: 'personalizado',
    movible: false,
    tipo: 'personalizado',
    activo: datos.activo !== false,
  });
  await marcarCalendarioDesactualizado(usuarioId);
  return feriadoPlano(feriado);
}

async function actualizarFeriado(id, cambios, usuarioId) {
  await inicializar();
  const feriado = await Feriado.findByPk(id);
  if (!feriado) throw errorConEstado('Feriado no encontrado', 404);

  const anio = cambios.anio === undefined ? feriado.anio : Number(cambios.anio);
  const fecha = cambios.fecha === undefined ? aISO(feriado.fecha) : aISO(cambios.fecha);
  if (!esAnioValido(anio) || !fecha || Number(fecha.slice(0, 4)) !== anio) {
    throw errorConEstado('La fecha debe corresponder al año indicado', 400);
  }

  const nombre = cambios.nombre === undefined
    ? feriado.nombre
    : String(cambios.nombre).trim();
  if (!nombre) throw errorConEstado('El nombre es obligatorio', 400);

  await verificarFechaDisponible(anio, fecha, id);
  await feriado.update({
    anio,
    fecha,
    nombre,
    activo: cambios.activo === undefined ? feriado.activo : Boolean(cambios.activo),
  });
  await marcarCalendarioDesactualizado(usuarioId);
  return feriadoPlano(feriado);
}

async function eliminarFeriado(id, usuarioId) {
  await inicializar();
  const feriado = await Feriado.findByPk(id);
  if (!feriado) throw errorConEstado('Feriado no encontrado', 404);
  if (feriado.origen !== 'personalizado') {
    throw errorConEstado('Los feriados oficiales no se eliminan; puedes desactivarlos', 400);
  }
  const plano = feriadoPlano(feriado);
  await feriado.destroy();
  await marcarCalendarioDesactualizado(usuarioId);
  return plano;
}

async function restaurarFeriados(anio, usuarioId) {
  await inicializar();
  if (!esAnioValido(anio)) throw errorConEstado('Año inválido', 400);

  const personalizados = await Feriado.findAll({ where: { anio, origen: 'personalizado' } });
  const fechasOcupadas = new Set(personalizados.map((f) => aISO(f.fecha)));

  await Feriado.destroy({ where: { anio, origen: 'oficial' } });
  const filas = generarFeriadosOficialesDetallados(anio)
    .filter((feriado) => !fechasOcupadas.has(feriado.fecha))
    .map((feriado) => ({
      anio,
      nombre: feriado.nombre,
      fecha: feriado.fecha,
      fechaOriginal: feriado.fechaOriginal,
      origen: 'oficial',
      movible: feriado.movible,
      tipo: feriado.tipo,
      activo: true,
    }));
  await Feriado.bulkCreate(filas, { ignoreDuplicates: true });
  await marcarCalendarioDesactualizado(usuarioId);
  return listarFeriados(anio);
}

async function actualizarDiasNoLaborables(dias, usuarioId) {
  await inicializar();
  const normalizados = validarDiasNoLaborables(dias);
  const configuracion = await Configuracion.findByPk(CONFIG_ID);
  const anteriores = [...(configuracion.diasNoLaborables || [])].map(Number).sort();
  const cambia = JSON.stringify(anteriores) !== JSON.stringify([...normalizados].sort());

  await configuracion.update({
    diasNoLaborables: normalizados,
    actualizadoPorId: usuarioId || null,
    calendarioDesactualizado: cambia || configuracion.calendarioDesactualizado,
  });
  await recargarCache();
  return { diasNoLaborables: normalizados, calendarioDesactualizado: cambia };
}

async function listarTasas() {
  await inicializar();
  const tasas = asegurarCache().tasas;
  const nombres = await nombresDeUsuarios(tasas.map((tasa) => tasa.creadoPorId));
  return tasas.map((tasa) => tasaPlana(tasa, nombres.get(tasa.creadoPorId)));
}

async function actualizarTasaMora(datos, usuarioId) {
  await inicializar();
  const tasaMensual = Number(datos.tasaMensual);
  if (!Number.isFinite(tasaMensual) || tasaMensual < 0 || tasaMensual > 20) {
    throw errorConEstado('La tasa mensual debe estar entre 0 y 20', 400);
  }
  const vigenteDesde = aISO(datos.vigenteDesde) || aISO(new Date());
  const tasaDiaria = tasaMensualADiaria(tasaMensual);

  const [tasa] = await TasaMora.upsert({
    vigenteDesde,
    tasaDiaria,
    creadoPorId: usuarioId || null,
  }, { returning: true });

  await recargarCache();
  return tasaPlana(tasa);
}

function obtenerCalendarioParaCalculos() {
  return asegurarCache().calendario;
}

// Variante segura para servicios que pueden ejecutarse antes de inicializar
// la configuración (scripts, pruebas, primer arranque).
function calendarioSeguro() {
  return cache?.calendario || calendarioPorDefecto;
}

function obtenerTasasParaCalculos() {
  return asegurarCache().tasas;
}

function resolverTasaParaFecha(fechaVencimiento) {
  if (!cache) return tasaMoraInicial();
  return resolverTasaMora(cache.tasas, fechaVencimiento) || tasaMoraInicial();
}

function tasaMoraInicial() {
  return { tasaDiaria: TASA_MORA_INICIAL_DIARIA, vigenteDesde: FECHA_INICIAL_TASA };
}

async function previsualizarRecalculo() {
  await inicializar();
  const prestamos = await Prestamo.findAll({
    where: { estado: ['desembolsado', 'cerrado'] },
    order: [['fechaDesembolso', 'ASC']],
  });
  const calendario = obtenerCalendarioParaCalculos();

  let prestamosAfectados = 0;
  let cuotasAfectadas = 0;
  const ejemplos = [];

  for (const prestamo of prestamos) {
    const resultado = await recalcularFechasCuotas(prestamo.id, { calendario, dryRun: true });
    if (resultado.cuotasActualizadas > 0) {
      prestamosAfectados++;
      cuotasAfectadas += resultado.cuotasActualizadas;
      for (const cambio of resultado.cambios) {
        if (ejemplos.length < 10) ejemplos.push({ ...cambio, prestamoId: prestamo.id });
      }
    }
  }

  return { prestamosAfectados, cuotasAfectadas, ejemplos };
}

async function aplicarRecalculo(usuarioId) {
  await inicializar();
  const prestamos = await Prestamo.findAll({
    where: { estado: ['desembolsado', 'cerrado'] },
    order: [['fechaDesembolso', 'ASC']],
  });
  const calendario = obtenerCalendarioParaCalculos();

  let prestamosAfectados = 0;
  let cuotasAfectadas = 0;

  for (const prestamo of prestamos) {
    const resultado = await recalcularFechasCuotas(prestamo.id, { calendario });
    if (resultado.cuotasActualizadas > 0) {
      prestamosAfectados++;
      cuotasAfectadas += resultado.cuotasActualizadas;
    }
  }

  await Configuracion.update(
    { calendarioDesactualizado: false, actualizadoPorId: usuarioId || null },
    { where: { id: CONFIG_ID } }
  );
  await recargarCache();
  return { prestamosAfectados, cuotasAfectadas };
}

module.exports = {
  inicializar,
  recargarCache,
  asegurarFeriadosDeAnio,
  obtenerConfiguracion,
  listarFeriados,
  crearFeriado,
  actualizarFeriado,
  eliminarFeriado,
  restaurarFeriados,
  actualizarDiasNoLaborables,
  listarTasas,
  actualizarTasaMora,
  obtenerCalendarioParaCalculos,
  calendarioSeguro,
  obtenerTasasParaCalculos,
  resolverTasaParaFecha,
  tasaMoraInicial,
  previsualizarRecalculo,
  aplicarRecalculo,
  validarDiasNoLaborables,
  errorConEstado,
};
