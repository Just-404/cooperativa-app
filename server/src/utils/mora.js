// Cálculo de mora con tasas históricas por fecha de vencimiento.
// La tasa de una cuota se resuelve según la tasa vigente en su vencimiento,
// nunca según el día en que se paga.

const { aISO, diferenciaDias } = require('./feriados');

const TASA_MORA_INICIAL_DIARIA = 0.001; // 0.1% diario = 3% mensual (30 días)
const FECHA_INICIAL_TASA = '2000-01-01';

// Convierte un porcentaje mensual (ej. 3 => 3%) a tasa diaria decimal.
function tasaMensualADiaria(tasaMensual) {
  return Math.round((Number(tasaMensual) / 100 / 30) * 1e6) / 1e6;
}

// Convierte una tasa diaria decimal a porcentaje mensual (30 días).
function tasaDiariaAMensual(tasaDiaria) {
  return Math.round(Number(tasaDiaria) * 30 * 100 * 100) / 100;
}

// Devuelve la tasa vigente para una fecha de vencimiento dada.
// `tasas` puede venir de Sequelize (instancias o plain objects).
function resolverTasaMora(tasas, fechaVencimiento) {
  const vencimiento = aISO(fechaVencimiento);
  const lista = (tasas || [])
    .map((tasa) => ({
      tasaDiaria: Number(tasa.tasaDiaria ?? tasa.dataValues?.tasaDiaria),
      vigenteDesde: aISO(tasa.vigenteDesde ?? tasa.dataValues?.vigenteDesde),
      id: tasa.id ?? tasa.dataValues?.id,
    }))
    .filter((tasa) => Number.isFinite(tasa.tasaDiaria) && tasa.vigenteDesde)
    .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde));

  return lista.find((tasa) => tasa.vigenteDesde <= vencimiento) || null;
}

// Monto de mora = montoTotal * tasaDiaria * días de atraso.
// No hay condonación por pagar en día no laborable.
function calcularMontoMora({ montoTotal, fechaVencimiento, tasaDiaria, hoy = null }) {
  const vencimiento = aISO(fechaVencimiento);
  const fechaHoy = aISO(hoy || new Date());
  const diasAtraso = Math.max(0, diferenciaDias(vencimiento, fechaHoy));
  const tasa = Number(tasaDiaria);

  if (!vencimiento || !Number.isFinite(tasa) || diasAtraso === 0) {
    return { diasAtraso: 0, monto: 0 };
  }

  const monto = Math.round(Number(montoTotal) * tasa * diasAtraso * 100) / 100;
  return { diasAtraso, monto: Math.max(0, monto) };
}

function round6(n) {
  return Math.round(Number(n) * 1e6) / 1e6;
}

module.exports = {
  TASA_MORA_INICIAL_DIARIA,
  FECHA_INICIAL_TASA,
  tasaMensualADiaria,
  tasaDiariaAMensual,
  resolverTasaMora,
  calcularMontoMora,
  round6,
};
