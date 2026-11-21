const {
  TASA_MORA_INICIAL_DIARIA,
  calcularMontoMora,
  resolverTasaMora,
  tasaDiariaAMensual,
  tasaMensualADiaria,
} = require('./mora');

describe('tasas de mora', () => {
  test('3% mensual equivale a 0.1% diario', () => {
    expect(tasaMensualADiaria(3)).toBe(0.001);
    expect(tasaDiariaAMensual(0.001)).toBe(3);
    expect(TASA_MORA_INICIAL_DIARIA).toBe(0.001);
  });

  test('resuelve la tasa vigente según la fecha de vencimiento', () => {
    const tasas = [
      { id: 'vieja', tasaDiaria: 0.001, vigenteDesde: '2000-01-01' },
      { id: 'nueva', tasaDiaria: 0.002, vigenteDesde: '2026-11-21' },
    ];
    expect(resolverTasaMora(tasas, '2026-11-20').id).toBe('vieja');
    expect(resolverTasaMora(tasas, '2026-11-21').id).toBe('nueva');
    expect(resolverTasaMora(tasas, '2026-12-15').id).toBe('nueva');
  });

  test('calcula mora por días calendario de atraso', () => {
    const resultado = calcularMontoMora({
      montoTotal: 10000,
      fechaVencimiento: '2026-11-01',
      tasaDiaria: 0.001,
      hoy: '2026-11-11',
    });
    expect(resultado).toEqual({ diasAtraso: 10, monto: 100 });
  });

  test('no genera mora antes del vencimiento ni con tasa 0', () => {
    expect(calcularMontoMora({
      montoTotal: 10000,
      fechaVencimiento: '2026-11-21',
      tasaDiaria: 0.001,
      hoy: '2026-11-21',
    }).monto).toBe(0);

    expect(calcularMontoMora({
      montoTotal: 10000,
      fechaVencimiento: '2026-11-01',
      tasaDiaria: 0,
      hoy: '2026-11-11',
    }).monto).toBe(0);
  });
});
