// Utilidades de fechas de calendario y feriados de República Dominicana.
//
// Todas las fechas de negocio (vencimiento de cuotas, desembolso, etc.) se manejan
// como textos "YYYY-MM-DD" para evitar desfases de un día por zona horaria.
//
// Reglas aplicadas (Ley 139-97 sobre traslado de feriados):
//   - Feriados trasladables: 6/ene (Reyes), 26/ene (Duarte), 1/may (Trabajo)
//     y 6/nov (Constitución).
//   - Martes o miércoles => se observa el lunes anterior.
//   - Jueves o viernes   => se observa el lunes siguiente.
//   - Sábado, domingo o lunes => se mantiene en su fecha original.
//   - 16/ago y 24/sep son fijos (no se trasladan).
//   - Viernes Santo y Corpus Christi se calculan según la Pascua.

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Convierte un valor (string ISO, 'YYYY-MM-DD' o Date) a 'YYYY-MM-DD'.
// Para Date se usan los componentes locales: representa la fecha de negocio,
// no el instante UTC.
function aISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

function partes(iso) {
  const [anio, mes, dia] = aISO(iso).split('-').map(Number);
  return { anio, mes, dia };
}

function crearUTC(anio, mes, dia) {
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function desplazarDias(iso, dias) {
  const { anio, mes, dia } = partes(iso);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return `${fecha.getUTCFullYear()}-${pad2(fecha.getUTCMonth() + 1)}-${pad2(fecha.getUTCDate())}`;
}

function diaDeSemana(iso) {
  const { anio, mes, dia } = partes(iso);
  return crearUTC(anio, mes, dia).getUTCDay(); // 0=domingo ... 6=sábado
}

function esFinDeSemana(iso) {
  const dia = diaDeSemana(iso);
  return dia === 0 || dia === 6;
}

// Domingo de Pascua (algoritmo gregoriano de Meeus/Butcher), en UTC.
function domingoPascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(anio, mes - 1, dia);
}

function isoDesdeUTC(ms) {
  const fecha = new Date(ms);
  return `${fecha.getUTCFullYear()}-${pad2(fecha.getUTCMonth() + 1)}-${pad2(fecha.getUTCDate())}`;
}

// Devuelve la fecha en que se observa un feriado trasladable según la Ley 139-97.
function fechaObservadaTrasladable(fechaOriginal) {
  const dia = diaDeSemana(fechaOriginal);
  if (dia === 2 || dia === 3) return desplazarDias(fechaOriginal, -(dia - 1)); // lunes anterior
  if (dia === 4 || dia === 5) return desplazarDias(fechaOriginal, 8 - dia); // lunes siguiente
  return fechaOriginal; // sábado, domingo o lunes
}

const cacheFeriadosDetallados = new Map();
const cacheFeriados = new Map();

const FERIADOS_FIJOS = [
  { nombre: 'Año Nuevo', mes: 1, dia: 1 },
  { nombre: 'Nuestra Señora de la Altagracia', mes: 1, dia: 21 },
  { nombre: 'Día de la Independencia', mes: 2, dia: 27 },
  { nombre: 'Día de la Restauración', mes: 8, dia: 16 },
  { nombre: 'Nuestra Señora de las Mercedes', mes: 9, dia: 24 },
  { nombre: 'Navidad', mes: 12, dia: 25 },
];

const FERIADOS_MOVIBLES = [
  { nombre: 'Día de los Santos Reyes', mes: 1, dia: 6 },
  { nombre: 'Día de Duarte', mes: 1, dia: 26 },
  { nombre: 'Día del Trabajo', mes: 5, dia: 1 },
  { nombre: 'Día de la Constitución', mes: 11, dia: 6 },
];

// Lista detallada de feriados oficiales de un año. Cada entrada incluye la
// fecha observada, la fecha legal original (cuando aplica) y su origen.
function generarFeriadosOficialesDetallados(anio) {
  if (cacheFeriadosDetallados.has(anio)) return cacheFeriadosDetallados.get(anio);

  const feriados = [];

  for (const f of FERIADOS_FIJOS) {
    feriados.push({
      nombre: f.nombre,
      fecha: `${anio}-${pad2(f.mes)}-${pad2(f.dia)}`,
      fechaOriginal: null,
      origen: 'oficial',
      movible: false,
      tipo: 'fijo',
    });
  }

  for (const f of FERIADOS_MOVIBLES) {
    const fechaOriginal = `${anio}-${pad2(f.mes)}-${pad2(f.dia)}`;
    feriados.push({
      nombre: f.nombre,
      fecha: fechaObservadaTrasladable(fechaOriginal),
      fechaOriginal,
      origen: 'oficial',
      movible: true,
      tipo: 'trasladable',
    });
  }

  const pascua = domingoPascua(anio);
  feriados.push({
    nombre: 'Viernes Santo',
    fecha: isoDesdeUTC(pascua - 2 * 86400000),
    fechaOriginal: null,
    origen: 'oficial',
    movible: true,
    tipo: 'movil',
  });
  feriados.push({
    nombre: 'Corpus Christi',
    fecha: isoDesdeUTC(pascua + 60 * 86400000),
    fechaOriginal: null,
    origen: 'oficial',
    movible: true,
    tipo: 'movil',
  });

  feriados.sort((a, b) => a.fecha.localeCompare(b.fecha));
  cacheFeriadosDetallados.set(anio, feriados);
  return feriados;
}

// Conjunto de fechas observadas (las que no se trabajan) de un año.
function generarFeriadosOficiales(anio) {
  if (cacheFeriados.has(anio)) return cacheFeriados.get(anio);
  const feriados = new Set(generarFeriadosOficialesDetallados(anio).map((f) => f.fecha));
  cacheFeriados.set(anio, feriados);
  return feriados;
}

function normalizarDiasNoLaborables(dias) {
  if (dias instanceof Set) return [...dias].map(Number);
  if (Array.isArray(dias)) return dias.map(Number);
  return [0, 6];
}

function normalizarMapaFeriados(feriadosPorAnio) {
  const mapa = new Map();
  if (!feriadosPorAnio) return mapa;

  const entradas = feriadosPorAnio instanceof Map
    ? feriadosPorAnio.entries()
    : Object.entries(feriadosPorAnio);

  for (const [anio, valores] of entradas) {
    const conjunto = new Set();
    const lista = valores instanceof Set ? [...valores] : (Array.isArray(valores) ? valores : []);
    for (const valor of lista) {
      if (valor && typeof valor === 'object') {
        if (valor.activo === false) continue;
        const iso = aISO(valor.fecha);
        if (iso) conjunto.add(iso);
      } else if (valor) {
        conjunto.add(aISO(valor));
      }
    }
    mapa.set(Number(anio), conjunto);
  }
  return mapa;
}

// Crea un calendario inyectable. `feriadosPorAnio` puede ser un Map u objeto
// año => fechas (strings ISO u objetos { fecha, activo }). Si un año no tiene
// entradas se usa el calendario oficial de ese año.
function crearCalendario({
  feriadosPorAnio = null,
  diasNoLaborables = [0, 6],
  diasFestivosAdicionales = [],
} = {}) {
  const diasNoLaborablesSet = new Set(normalizarDiasNoLaborables(diasNoLaborables));
  const mapa = normalizarMapaFeriados(feriadosPorAnio);
  const extras = new Set(diasFestivosAdicionales.map((d) => String(d).slice(-5))); // 'MM-DD'

  function esFeriado(iso) {
    const fecha = aISO(iso);
    if (!fecha) return false;
    const anio = partes(fecha).anio;
    const configurados = mapa.get(anio);
    if (configurados) return configurados.has(fecha);
    return generarFeriadosOficiales(anio).has(fecha) || extras.has(fecha.slice(5));
  }

  function esDiaLaborable(iso) {
    const fecha = aISO(iso);
    if (!fecha) return false;
    return !diasNoLaborablesSet.has(diaDeSemana(fecha)) && !esFeriado(fecha);
  }

  return {
    diasNoLaborables: diasNoLaborablesSet,
    feriadosPorAnio: mapa,
    esFeriado,
    esDiaLaborable,
  };
}

// Calendario usado por defecto cuando aún no hay configuración en la BD.
// El 31/dic se mantiene como fecha no laborable "de facto" y es configurable
// desde el módulo de Configuración.
const calendarioPorDefecto = crearCalendario({ diasFestivosAdicionales: ['12-31'] });

// Construye un calendario a partir de las filas de la tabla `feriados`.
function crearCalendarioDesdeConfiguracion({ feriados = [], diasNoLaborables = [0, 6] } = {}) {
  const feriadosPorAnio = new Map();

  for (const feriado of feriados) {
    if (feriado.activo === false) continue;
    const fecha = aISO(feriado.fecha);
    if (!fecha) continue;
    const anio = Number(feriado.anio || partes(fecha).anio);
    if (!feriadosPorAnio.has(anio)) feriadosPorAnio.set(anio, new Set());
    feriadosPorAnio.get(anio).add(fecha);
  }

  return crearCalendario({ feriadosPorAnio, diasNoLaborables });
}

function esFeriado(iso, calendario = calendarioPorDefecto) {
  return calendario.esFeriado(iso);
}

function esDiaLaborable(iso, calendario = calendarioPorDefecto) {
  return calendario.esDiaLaborable(iso);
}

function siguienteDiaLaborable(iso, calendario = calendarioPorDefecto) {
  let fecha = desplazarDias(aISO(iso), 1);
  while (!calendario.esDiaLaborable(fecha)) {
    fecha = desplazarDias(fecha, 1);
  }
  return fecha;
}

// Suma meses a una fecha conservando el día cuando es posible
// (ej. 31/01 + 1 mes => 28/02, no 03/03).
function sumarMeses(iso, meses) {
  const { anio, mes, dia } = partes(iso);
  const totalMeses = anio * 12 + (mes - 1) + meses;
  const nuevoAnio = Math.floor(totalMeses / 12);
  const nuevoMes = ((totalMeses % 12) + 12) % 12;
  const ultimoDia = new Date(Date.UTC(nuevoAnio, nuevoMes + 1, 0)).getUTCDate();
  const nuevoDia = Math.min(dia, ultimoDia);
  return `${nuevoAnio}-${pad2(nuevoMes + 1)}-${pad2(nuevoDia)}`;
}

// Fecha de vencimiento de la cuota número `numeroCuota`:
// fecha base + n meses, ajustada al siguiente día laborable y garantizando
// que quede después de la cuota anterior (si se indica).
function calcularFechaVencimiento(fechaBase, numeroCuota, despuesDe = null, calendario = calendarioPorDefecto) {
  let fecha = sumarMeses(aISO(fechaBase), numeroCuota);
  if (despuesDe && fecha <= despuesDe) {
    fecha = desplazarDias(despuesDe, 1);
  }
  while (!calendario.esDiaLaborable(fecha)) {
    fecha = desplazarDias(fecha, 1);
  }
  return fecha;
}

// Diferencia en días de calendario entre dos fechas (b - a).
function diferenciaDias(desdeISO, hastaISO) {
  const desde = partes(desdeISO);
  const hasta = partes(hastaISO);
  const msDesde = crearUTC(desde.anio, desde.mes, desde.dia).getTime();
  const msHasta = crearUTC(hasta.anio, hasta.mes, hasta.dia).getTime();
  return Math.round((msHasta - msDesde) / 86400000);
}

module.exports = {
  aISO,
  desplazarDias,
  diaDeSemana,
  esFinDeSemana,
  generarFeriadosOficialesDetallados,
  generarFeriadosOficiales,
  fechaObservadaTrasladable,
  crearCalendario,
  crearCalendarioDesdeConfiguracion,
  calendarioPorDefecto,
  esFeriado,
  esDiaLaborable,
  siguienteDiaLaborable,
  sumarMeses,
  calcularFechaVencimiento,
  diferenciaDias,
};
