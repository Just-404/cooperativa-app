// Utilidades de fechas de calendario y feriados de República Dominicana.
//
// Todas las fechas de negocio (vencimiento de cuotas, desembolso, etc.) se manejan
// como textos "YYYY-MM-DD" para evitar desfases de un día por zona horaria.

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

const cacheFeriados = new Map();

// Feriados oficiales de República Dominicana para un año dado.
// Incluye los feriados fijos, los que se trasladan a lunes, Semana Santa,
// Corpus Christi y el 31 de diciembre (día no laborable en la práctica).
function feriadosDeAnio(anio) {
  if (cacheFeriados.has(anio)) return cacheFeriados.get(anio);

  const feriados = new Set();

  // Feriados fijos
  feriados.add(`${anio}-01-01`); // Año Nuevo
  feriados.add(`${anio}-01-21`); // Nuestra Señora de la Altagracia
  feriados.add(`${anio}-02-27`); // Día de la Independencia
  feriados.add(`${anio}-05-01`); // Día del Trabajo
  feriados.add(`${anio}-11-06`); // Día de la Constitución
  feriados.add(`${anio}-12-25`); // Navidad
  feriados.add(`${anio}-12-31`); // Fin de año (no laborable)

  // Feriados que por ley se trasladan al lunes:
  // si caen martes, miércoles o jueves pasan al lunes anterior;
  // si caen sábado o domingo pasan al lunes siguiente.
  const trasladables = [
    `${anio}-01-06`, // Día de los Santos Reyes
    `${anio}-08-16`, // Día de la Restauración
    `${anio}-09-24`, // Nuestra Señora de las Mercedes
  ];

  for (const fecha of trasladables) {
    feriados.add(fecha);
    const dia = diaDeSemana(fecha);
    if (dia >= 2 && dia <= 4) {
      feriados.add(desplazarDias(fecha, -(dia - 1))); // lunes anterior
    } else if (dia === 0 || dia === 6) {
      feriados.add(desplazarDias(fecha, dia === 0 ? 1 : 2)); // lunes siguiente
    }
  }

  // Semana Santa y Corpus Christi (fechas móviles)
  const pascua = domingoPascua(anio);
  feriados.add(isoDesdeUTC(pascua - 2 * 86400000)); // Viernes Santo
  feriados.add(isoDesdeUTC(pascua + 60 * 86400000)); // Corpus Christi (jueves)

  cacheFeriados.set(anio, feriados);
  return feriados;
}

function esFeriado(iso) {
  const fecha = aISO(iso);
  return feriadosDeAnio(partes(fecha).anio).has(fecha);
}

function esDiaLaborable(iso) {
  const fecha = aISO(iso);
  return !esFinDeSemana(fecha) && !esFeriado(fecha);
}

function siguienteDiaLaborable(iso) {
  let fecha = desplazarDias(aISO(iso), 1);
  while (!esDiaLaborable(fecha)) {
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
function calcularFechaVencimiento(fechaBase, numeroCuota, despuesDe = null) {
  let fecha = sumarMeses(aISO(fechaBase), numeroCuota);
  if (despuesDe && fecha <= despuesDe) {
    fecha = desplazarDias(despuesDe, 1);
  }
  while (!esDiaLaborable(fecha)) {
    fecha = siguienteDiaLaborable(fecha);
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
  feriadosDeAnio,
  esFeriado,
  esDiaLaborable,
  siguienteDiaLaborable,
  sumarMeses,
  calcularFechaVencimiento,
  diferenciaDias,
};
