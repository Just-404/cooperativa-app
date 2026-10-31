// Utilidades para mostrar fechas de calendario sin desfases por zona horaria.
// El backend envía las fechas como "YYYY-MM-DD"; si se pasan directo a
// `new Date(...)` se interpretan como UTC y en República Dominicana (UTC-4)
// se muestran un día antes.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function partesFecha(valor) {
  if (!valor) return null;

  if (typeof valor === 'string') {
    const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return { anio: Number(match[1]), mes: Number(match[2]), dia: Number(match[3]) };
    }
    return null;
  }

  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, dia: fecha.getDate() };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Devuelve la fecha como dd/mm/aaaa sin desfase de zona horaria.
export function formatearFecha(valor) {
  const partes = partesFecha(valor);
  if (!partes) return '';
  return `${pad2(partes.dia)}/${pad2(partes.mes)}/${partes.anio}`;
}

// Devuelve el nombre del día de la semana de la fecha.
export function nombreDia(valor) {
  const partes = partesFecha(valor);
  if (!partes) return '';
  const fecha = new Date(Date.UTC(partes.anio, partes.mes - 1, partes.dia));
  return DIAS[fecha.getUTCDay()];
}

// Fecha de hoy como "YYYY-MM-DD" (hora local).
export function hoyISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${pad2(hoy.getMonth() + 1)}-${pad2(hoy.getDate())}`;
}

// Días de calendario transcurridos desde la fecha hasta hoy (nunca negativo).
export function diasAtraso(valor) {
  const partes = partesFecha(valor);
  if (!partes) return 0;
  const vencimiento = Date.UTC(partes.anio, partes.mes - 1, partes.dia);
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.max(0, Math.round((hoyUTC - vencimiento) / 86400000));
}
