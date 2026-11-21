import { hoyISO } from '../../../utils/fecha';

function partes(iso) {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { anio: Number(match[1]), mes: Number(match[2]), dia: Number(match[3]) };
}

function aISO(anio, mes, dia) {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function desplazar(iso, dias) {
  const p = partes(iso);
  if (!p) return null;
  const fecha = new Date(Date.UTC(p.anio, p.mes - 1, p.dia + dias));
  return aISO(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, fecha.getUTCDate());
}

function diaSemana(iso) {
  const p = partes(iso);
  if (!p) return null;
  return new Date(Date.UTC(p.anio, p.mes - 1, p.dia)).getUTCDay();
}

// Siguiente día laborable local, según feriados activos y días no laborables.
export function siguienteDiaLaborableLocal(feriados = [], diasNoLaborables = [0, 6], desde = null) {
  const feriadosActivos = new Set(
    feriados.filter((f) => f.activo !== false).map((f) => String(f.fecha).slice(0, 10))
  );
  const noLaborables = new Set(diasNoLaborables.map(Number));
  let fecha = desde || hoyISO();

  for (let i = 0; i < 60; i++) {
    if (!noLaborables.has(diaSemana(fecha)) && !feriadosActivos.has(fecha)) return fecha;
    fecha = desplazar(fecha, 1);
  }
  return fecha;
}
