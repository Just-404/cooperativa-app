const {
  aISO,
  calcularFechaVencimiento,
  crearCalendario,
  crearCalendarioDesdeConfiguracion,
  diaDeSemana,
  esDiaLaborable,
  esFeriado,
  fechaObservadaTrasladable,
  generarFeriadosOficiales,
  generarFeriadosOficialesDetallados,
  sumarMeses,
} = require('./feriados');

describe('calendario oficial dominicano', () => {
  test('genera exactamente el calendario oficial de 2026', () => {
    expect([...generarFeriadosOficiales(2026)].sort()).toEqual([
      '2026-01-01', // Año Nuevo
      '2026-01-05', // Reyes (trasladado desde 06/01)
      '2026-01-21', // Altagracia
      '2026-01-26', // Duarte
      '2026-02-27', // Independencia
      '2026-04-03', // Viernes Santo
      '2026-05-04', // Trabajo (trasladado desde 01/05)
      '2026-06-04', // Corpus Christi
      '2026-08-16', // Restauración (fijo)
      '2026-09-24', // Mercedes (fijo)
      '2026-11-09', // Constitución (trasladado desde 06/11)
      '2026-12-25', // Navidad
    ]);
  });

  test('aplica la regla de traslado de la Ley 139-97', () => {
    // Martes y miércoles => lunes anterior
    expect(fechaObservadaTrasladable('2026-01-06')).toBe('2026-01-05'); // martes
    expect(fechaObservadaTrasladable('2020-01-21')).toBe('2020-01-20'); // martes
    // Jueves y viernes => lunes siguiente
    expect(fechaObservadaTrasladable('2026-05-01')).toBe('2026-05-04'); // viernes
    expect(fechaObservadaTrasladable('2026-11-06')).toBe('2026-11-09'); // viernes
    expect(fechaObservadaTrasladable('2025-05-01')).toBe('2025-05-05'); // jueves
    // Sábado, domingo y lunes => sin traslado
    expect(fechaObservadaTrasladable('2021-05-01')).toBe('2021-05-01'); // sábado
    expect(fechaObservadaTrasladable('2022-05-01')).toBe('2022-05-01'); // domingo
    expect(fechaObservadaTrasladable('2023-05-01')).toBe('2023-05-01'); // lunes
  });

  test('incluye fecha original y tipo en el detalle de feriados', () => {
    const detalle = generarFeriadosOficialesDetallados(2026);
    const reyes = detalle.find((f) => f.nombre === 'Día de los Santos Reyes');
    expect(reyes).toMatchObject({
      fecha: '2026-01-05',
      fechaOriginal: '2026-01-06',
      origen: 'oficial',
      movible: true,
      tipo: 'trasladable',
    });

    const duarte = detalle.find((f) => f.nombre === 'Día de Duarte');
    expect(duarte).toMatchObject({ fecha: '2026-01-26', movible: true });
    expect(detalle.find((f) => f.nombre === 'Día de la Restauración').movible).toBe(false);
    expect(detalle.find((f) => f.nombre === 'Nuestra Señora de las Mercedes').movible).toBe(false);
  });

  test('marca correctamente días laborables y feriados en 2026', () => {
    const calendario = crearCalendario(); // sin 31/dic

    // Feriados trasladados
    expect(esFeriado('2026-05-01', calendario)).toBe(false);
    expect(esFeriado('2026-05-04', calendario)).toBe(true);
    expect(esFeriado('2026-11-06', calendario)).toBe(false);
    expect(esFeriado('2026-11-09', calendario)).toBe(true);

    // Ya no se marcan días que antes se trasladaban por error
    expect(esFeriado('2026-01-06', calendario)).toBe(false);
    expect(esFeriado('2026-08-17', calendario)).toBe(false);
    expect(esFeriado('2026-09-21', calendario)).toBe(false);

    // Duarte ahora sí es feriado
    expect(esFeriado('2026-01-26', calendario)).toBe(true);

    // El 31/dic no es feriado oficial
    expect(esFeriado('2026-12-31', calendario)).toBe(false);

    // Fines de semana
    expect(esDiaLaborable('2026-05-02', calendario)).toBe(false); // sábado
    expect(esDiaLaborable('2026-05-03', calendario)).toBe(false); // domingo
    expect(esDiaLaborable('2026-05-05', calendario)).toBe(true); // martes
  });

  test('el calendario por defecto conserva el 31/dic como no laborable', () => {
    const { calendarioPorDefecto } = require('./feriados');
    expect(esFeriado('2026-12-31', calendarioPorDefecto)).toBe(true);
    expect(esDiaLaborable('2026-12-31')).toBe(false);
  });
});

describe('calendario configurable', () => {
  test('permite definir días no laborables distintos a sábado/domingo', () => {
    const calendario = crearCalendario({ diasNoLaborables: [0] });
    expect(diaDeSemana('2026-05-02')).toBe(6); // sábado
    expect(esDiaLaborable('2026-05-02', calendario)).toBe(true);
    expect(esDiaLaborable('2026-05-03', calendario)).toBe(false); // domingo
  });

  test('acepta feriados personalizados por año e ignora los inactivos', () => {
    const calendario = crearCalendario({
      feriadosPorAnio: {
        2026: [
          { fecha: '2026-07-15', activo: true },
          { fecha: '2026-07-16', activo: false },
        ],
      },
    });
    expect(esFeriado('2026-07-15', calendario)).toBe(true);
    expect(esFeriado('2026-07-16', calendario)).toBe(false);
    // Un año sin configuración usa el calendario oficial
    expect(esFeriado('2025-05-01', calendario)).toBe(false);
    expect(esFeriado('2025-05-05', calendario)).toBe(true);
  });

  test('crea calendario desde filas de la base de datos', () => {
    const calendario = crearCalendarioDesdeConfiguracion({
      feriados: [
        { anio: 2026, fecha: '2026-07-15', activo: true },
        { anio: 2026, fecha: '2026-07-16', activo: false },
      ],
      diasNoLaborables: [0, 6],
    });
    expect(esFeriado('2026-07-15', calendario)).toBe(true);
    expect(esFeriado('2026-07-16', calendario)).toBe(false);
  });

  test('un feriado configurado mueve el vencimiento al siguiente día laborable', () => {
    const sinFeriado = crearCalendario({ diasNoLaborables: [0] });
    const conFeriado = crearCalendario({
      diasNoLaborables: [0],
      feriadosPorAnio: { 2026: ['2026-07-15'] },
    });

    expect(calcularFechaVencimiento('2026-06-15', 1, null, sinFeriado)).toBe('2026-07-15');
    expect(calcularFechaVencimiento('2026-06-15', 1, null, conFeriado)).toBe('2026-07-16');
  });
});

describe('calcularFechaVencimiento', () => {
  test('evita fines de semana y feriados configurados', () => {
    const calendario = crearCalendario({
      feriadosPorAnio: { 2026: ['2026-07-15'] },
    });

    // 15/07/2026 es miércoles pero se declaró feriado => jueves 16
    expect(calcularFechaVencimiento('2026-06-15', 1, null, calendario)).toBe('2026-07-16');
  });

  test('respeta la fecha mínima de la cuota anterior', () => {
    const calendario = crearCalendario();
    // La cuota 2 caería el 3/may (feriado) => 4/may (también feriado) => 5/may
    expect(calcularFechaVencimiento('2026-04-03', 1, null, calendario)).toBe('2026-05-05');
    // Si la anterior fue 5/may, la siguiente no puede ser <= 5/may
    expect(calcularFechaVencimiento('2026-04-03', 1, '2026-05-05', calendario)).toBe('2026-05-06');
  });

  test('ajusta fin de mes antes de aplicar el calendario', () => {
    const calendario = crearCalendario();
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
    // 28/feb/2026 es sábado => lunes 2/mar
    expect(calcularFechaVencimiento('2026-01-31', 1, null, calendario)).toBe('2026-03-02');
  });

  test('maneja vencimientos en noviembre y enero sin caer en feriados trasladados', () => {
    const calendario = crearCalendario();
    // 9/nov es el feriado observado (Constitución) => se mueve al 10/nov
    expect(calcularFechaVencimiento('2026-10-09', 1, null, calendario)).toBe('2026-11-10');
    // 6/nov es laborable: el feriado se observa el lunes 9/nov
    expect(calcularFechaVencimiento('2026-10-06', 1, null, calendario)).toBe('2026-11-06');
    // 6/ene/2026 es martes laborable: Reyes se observó el lunes 5/ene
    expect(calcularFechaVencimiento('2025-12-06', 1, null, calendario)).toBe('2026-01-06');
    // 5/ene/2026 sí es feriado => se mueve al 6/ene (martes laborable)
    expect(calcularFechaVencimiento('2025-12-05', 1, null, calendario)).toBe('2026-01-06');
  });
});

describe('utilidades de fecha', () => {
  test('aISO acepta Date, ISO con hora y null', () => {
    expect(aISO('2026-11-21T15:30:00.000Z')).toBe('2026-11-21');
    expect(aISO(new Date(2026, 10, 21))).toBe('2026-11-21');
    expect(aISO(null)).toBeNull();
  });

  test('diaDeSemana usa domingo=0', () => {
    expect(diaDeSemana('2026-11-21')).toBe(6); // sábado
    expect(diaDeSemana('2026-11-22')).toBe(0); // domingo
  });
});
