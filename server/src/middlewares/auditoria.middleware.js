const {
  CuentaAhorro,
  Cuota,
  Pago,
  Prestamo,
  ScoringCrediticio,
  Socio,
  Transaccion,
  Usuario,
  Ticket,
  TipoPrestamo,
  Feriado,
  Configuracion,
  TasaMora,
} = require('../models');
const auditoriaService = require('../services/auditoria.service');

const MODELOS_POR_ENTIDAD = {
  cuenta: CuentaAhorro,
  cuota: Cuota,
  pago: Pago,
  prestamo: Prestamo,
  prestamos: Prestamo,
  scoring: ScoringCrediticio,
  socio: Socio,
  transaccion: Transaccion,
  tipo_prestamo: TipoPrestamo,
  ticket: Ticket,
  usuario: Usuario,
  feriado: Feriado,
  configuracion: Configuracion,
  tasa_mora: TasaMora,
};

const ENTIDAD_POR_ACCION = {
  crear_usuario: 'usuario',
  eliminar_socio: 'socio',
};

const ACCIONES_DE_ACTUALIZACION = new Set([
  'aprobar_prestamo',
  'rechazar_prestamo',
  'evaluar_prestamo',
  'desembolsar_prestamo',
  'cerrar_cuenta',
  'recalcular_fechas_cuotas',
  'recalcular_fechas_global',
  'restaurar_feriados',
]);

function sanitizar(valor, vistos = new WeakSet()) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (valor instanceof Date) return valor.toISOString();
  if (vistos.has(valor)) return '[Referencia circular]';
  vistos.add(valor);

  if (Array.isArray(valor)) return valor.map((item) => sanitizar(item, vistos));

  const plano = typeof valor.get === 'function' ? valor.get({ plain: true }) : valor;
  return Object.fromEntries(
    Object.entries(plano)
      .filter(([campo]) => !/password|token|secret|authorization/i.test(campo))
      .map(([campo, contenido]) => [campo, sanitizar(contenido, vistos)])
  );
}

function aPlano(valor) {
  if (Array.isArray(valor)) return valor.map(aPlano);
  if (valor && typeof valor.get === 'function') return valor.get({ plain: true });
  if (valor && typeof valor.toJSON === 'function') return valor.toJSON();
  return valor;
}

function idDeRespuesta(respuesta, visitados = new WeakSet()) {
  if (!respuesta || typeof respuesta !== 'object') return null;
  if (respuesta.id) return String(respuesta.id);
  const plano = aPlano(respuesta);
  if (!plano || typeof plano !== 'object' || visitados.has(plano)) return null;
  visitados.add(plano);
  for (const valor of Object.values(plano)) {
    const id = idDeRespuesta(valor, visitados);
    if (id) return id;
  }
  return null;
}

function idDeSolicitud(req) {
  return req.params?.id
    || req.params?.cuentaId
    || req.params?.prestamoId
    || req.params?.socioId
    || req.params?.cuotaId
    || (req.body?.anio ? String(req.body.anio) : null)
    || null;
}

function esActualizacion(req, accion) {
  return req.method === 'PUT'
    || req.method === 'PATCH'
    || accion.startsWith('actualizar_')
    || accion.startsWith('cambiar_estado_')
    || ACCIONES_DE_ACTUALIZACION.has(accion);
}

function esEliminacion(req, accion) {
  if (ACCIONES_DE_ACTUALIZACION.has(accion)) return false;
  return req.method === 'DELETE' || accion.startsWith('eliminar_');
}

async function obtenerEstado(modelo, id, accion) {
  if (!modelo || !id) return null;
  if (accion === 'recalcular_fechas_cuotas') {
    return modelo.findAll({ where: { prestamoId: id }, order: [['numeroCuota', 'ASC']] });
  }
  if (accion === 'recalcular_fechas_global') {
    return modelo.findAll({ where: { estado: 'pendiente' }, order: [['numeroCuota', 'ASC']] });
  }
  if (accion === 'restaurar_feriados') {
    return modelo.findAll({ where: { anio: id }, order: [['fecha', 'ASC']] });
  }
  return modelo.findByPk(id);
}

async function capturarCambiosRelacionados(accion, req) {
  const prestamoId = req.body?.prestamoId || req.params?.id;
  const especificaciones = [];

  if (accion === 'deposito' || accion === 'retiro') {
    especificaciones.push({
      entidad: 'cuenta',
      modelo: CuentaAhorro,
      id: req.body?.cuentaId,
    });
  } else if (accion === 'registrar_pago') {
    const cuotaId = req.body?.cuotaId;
    const cuota = cuotaId ? await Cuota.findByPk(cuotaId) : null;
    if (cuotaId) especificaciones.push({ entidad: 'cuota', modelo: Cuota, id: cuotaId });
    const cuotaPlana = aPlano(cuota);
    if (cuotaPlana?.prestamoId) {
      especificaciones.push({
        entidad: 'prestamo',
        modelo: Prestamo,
        id: cuotaPlana.prestamoId,
      });
    }
  } else if (accion === 'abono_capital') {
    especificaciones.push(
      { entidad: 'prestamo', modelo: Prestamo, id: prestamoId },
      {
        entidad: 'cuotas',
        modelo: Cuota,
        where: { prestamoId },
        multiple: true,
      }
    );
  } else if (accion === 'desembolsar_prestamo') {
    especificaciones.push({
      entidad: 'cuotas',
      modelo: Cuota,
      where: { prestamoId },
      multiple: true,
    });
  }

  return Promise.all(especificaciones.filter((spec) => spec.id || spec.where).map(async (spec) => {
    try {
      const estado = spec.multiple
        ? await spec.modelo.findAll({ where: spec.where, order: [['numeroCuota', 'ASC']] })
        : await spec.modelo.findByPk(spec.id);
      return { ...spec, antes: sanitizar(aPlano(estado)) };
    } catch (err) {
      console.error(`No se pudo capturar el estado previo de ${spec.entidad} en auditoría:`, err.message);
      return { ...spec, antes: null };
    }
  }));
}

async function obtenerCambiosRelacionadosDespues(cambios) {
  return Promise.all(cambios.map(async ({ entidad, modelo, id, where, multiple, antes }) => {
    try {
      const estado = multiple
        ? await modelo.findAll({ where, order: [['numeroCuota', 'ASC']] })
        : await modelo.findByPk(id);
      return { entidad, antes, despues: sanitizar(aPlano(estado)) };
    } catch (err) {
      console.error(`No se pudo capturar el estado posterior de ${entidad} en auditoría:`, err.message);
      return { entidad, antes, despues: null };
    }
  }));
}

function buscarCampo(registros, campo) {
  const pendientes = Array.isArray(registros) ? [...registros] : [registros];
  const vistos = new WeakSet();

  while (pendientes.length > 0) {
    const valor = pendientes.pop();
    if (!valor || typeof valor !== 'object' || vistos.has(valor)) continue;
    vistos.add(valor);
    if (valor[campo]) return valor[campo];
    pendientes.push(...Object.values(valor));
  }
  return null;
}

function nombreDePersona(persona) {
  if (!persona) return '';
  return [persona.nombre, persona.apellido].filter(Boolean).join(' ').trim();
}

async function obtenerNombreAfectado(contexto, req, antes, despues, cambiosRelacionados) {
  const registros = [antes, despues, cambiosRelacionados];
  const registroDirecto = contexto.entidad === 'socio' || contexto.entidad === 'usuario'
    ? despues || antes
    : null;
  const nombreDirecto = nombreDePersona(registroDirecto);
  if (nombreDirecto) return nombreDirecto;

  try {
    let socioId = buscarCampo(registros, 'socioId') || req.body?.socioId;
    let usuarioId = contexto.entidad === 'ticket'
      ? buscarCampo(registros, 'usuarioId')
      : null;
    let prestamoId = buscarCampo(registros, 'prestamoId') || req.body?.prestamoId;
    const cuentaId = buscarCampo(registros, 'cuentaId') || req.body?.cuentaId;
    const cuotaId = buscarCampo(registros, 'cuotaId') || req.body?.cuotaId;

    if (!prestamoId && cuotaId) {
      const cuota = aPlano(await Cuota.findByPk(cuotaId));
      prestamoId = cuota?.prestamoId;
    }
    if (!socioId && prestamoId) {
      const prestamo = aPlano(await Prestamo.findByPk(prestamoId));
      socioId = prestamo?.socioId;
    }
    if (!socioId && cuentaId) {
      const cuenta = aPlano(await CuentaAhorro.findByPk(cuentaId));
      socioId = cuenta?.socioId;
    }
    if (socioId) {
      return nombreDePersona(aPlano(await Socio.findByPk(socioId)));
    }
    if (usuarioId) {
      return nombreDePersona(aPlano(await Usuario.findByPk(usuarioId)));
    }
  } catch (err) {
    console.error('No se pudo resolver la persona afectada en auditoría:', err.message);
  }
  return '';
}

function auditoriaMiddleware(accion, entidad) {
  return (req, res, next) => {
    const entidadResuelta = entidad || ENTIDAD_POR_ACCION[accion] || null;
    const modelo = MODELOS_POR_ENTIDAD[entidadResuelta];
    const actualizacion = esActualizacion(req, accion);
    const eliminacion = esEliminacion(req, accion);
    const idPrevio = idDeSolicitud(req);

    obtenerEstado(modelo, actualizacion || eliminacion ? idPrevio : null, accion)
      .then(async (antes) => {
        let cambiosRelacionados = [];
        try {
          cambiosRelacionados = await capturarCambiosRelacionados(accion, req);
        } catch (err) {
          console.error('No se pudieron capturar estados relacionados de auditoría:', err.message);
        }
        registrarAlFinal(req, res, next, {
          accion,
          entidad: entidadResuelta,
          modelo,
          actualizacion,
          eliminacion,
          idPrevio,
          antes: sanitizar(aPlano(antes)),
          cambiosRelacionados,
        });
      })
      .catch((err) => {
        console.error('No se pudo capturar el estado previo de auditoría:', err.message);
        registrarAlFinal(req, res, next, {
          accion,
          entidad: entidadResuelta,
          modelo,
          actualizacion,
          eliminacion,
          idPrevio,
          antes: null,
          cambiosRelacionados: [],
        });
      });
  };
}

function registrarAlFinal(req, res, next, contexto) {
  let cuerpoRespuesta;
  const jsonOriginal = res.json.bind(res);
  res.json = (cuerpo) => {
    cuerpoRespuesta = cuerpo;
    return jsonOriginal(cuerpo);
  };

  res.once('finish', () => {
    if (res.statusCode >= 400) return;

    const usuarioId = req.user?.id || aPlano(cuerpoRespuesta)?.usuario?.id;
    if (!usuarioId) return;

    const usarIdRespuesta = !['restaurar_feriados', 'recalcular_fechas_global'].includes(contexto.accion);
    const idRespuesta = usarIdRespuesta ? idDeRespuesta(cuerpoRespuesta) : null;
    const entidadId = idRespuesta || contexto.idPrevio;

    Promise.all([
      obtenerDespues(contexto, entidadId, cuerpoRespuesta),
      obtenerCambiosRelacionadosDespues(contexto.cambiosRelacionados),
    ])
      .then(async ([despues, cambiosRelacionados]) => {
        const accionActualizaCuenta = contexto.accion === 'deposito' || contexto.accion === 'retiro';
        const cambioCuenta = accionActualizaCuenta
          ? cambiosRelacionados.find((cambio) => cambio.entidad === 'cuenta')
          : null;
        const detalle = {
          operacion: cambioCuenta
            ? 'actualizar'
            : contexto.eliminacion
              ? 'eliminar'
              : contexto.actualizacion
                ? 'actualizar'
                : 'insertar',
          antes: cambioCuenta ? cambioCuenta.antes : contexto.antes,
          despues: cambioCuenta ? cambioCuenta.despues : sanitizar(aPlano(despues)),
          datos: sanitizar(req.body),
        };
        if (cambioCuenta) detalle.movimiento = sanitizar(aPlano(despues));
        const otrosCambios = cambioCuenta
          ? cambiosRelacionados.filter((cambio) => cambio !== cambioCuenta)
          : cambiosRelacionados;
        if (otrosCambios.length > 0) detalle.cambiosRelacionados = otrosCambios;
        if (despues === null && cuerpoRespuesta) {
          detalle.resultado = sanitizar(aPlano(cuerpoRespuesta));
        }
        const afectado = await obtenerNombreAfectado(
          contexto,
          req,
          detalle.antes,
          detalle.despues,
          otrosCambios
        );
        if (afectado) detalle.afectado = afectado;

        return auditoriaService.registrar({
          usuarioId,
          accion: contexto.accion,
          entidad: contexto.entidad,
          entidadId: entidadId ? String(entidadId) : null,
          detalle: JSON.stringify(detalle),
        });
      })
      .catch((err) => console.error('No se pudo registrar la auditoría:', err.message));
  });

  next();
}

async function obtenerDespues(contexto, entidadId, cuerpoRespuesta) {
  if (contexto.eliminacion) return null;
  if (contexto.modelo && entidadId) {
    const despues = await obtenerEstado(contexto.modelo, entidadId, contexto.accion);
    if (despues) return despues;
  }
  return aPlano(cuerpoRespuesta) || null;
}

module.exports = auditoriaMiddleware;
