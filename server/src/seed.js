const { sequelize, Usuario, TipoPrestamo, Socio, Prestamo, Cuota } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });

  // Crear socios de prueba
  const sociosData = [
    { nombre: 'María', apellido: 'Pérez', documento: '12345678', email: 'maria@test.com', telefono: '123-456-7890', fechaNacimiento: '1980-05-15' },
    { nombre: 'Carlos', apellido: 'Gómez', documento: '87654321', email: 'carlos@test.com', telefono: '987-654-3210', fechaNacimiento: '1975-08-20' },
    { nombre: 'Ana', apellido: 'Sánchez', documento: '11223344', email: 'ana@test.com', telefono: '555-123-4567', fechaNacimiento: '1990-01-10' },
  ];

  const socios = [];
  for (const datos of sociosData) {
    const [socio, creado] = await Socio.findOrCreate({
      where: { documento: datos.documento },
      defaults: datos,
    });
    socios.push(socio);
    console.log(`Socio ${socio.nombre} ${socio.apellido} ${creado ? 'creado' : 'ya existía'}`);
  }

  // Crear tipos de préstamo
  const tipos = [
    { nombre: 'Préstamo personal', tasaInteresAnual: 18, plazoMaximoMeses: 24, montoMinimo: 5000, montoMaximo: 150000 },
    { nombre: 'Préstamo hipotecario', tasaInteresAnual: 10, plazoMaximoMeses: 180, montoMinimo: 200000, montoMaximo: 3000000 },
    { nombre: 'Préstamo comercial', tasaInteresAnual: 14, plazoMaximoMeses: 60, montoMinimo: 50000, montoMaximo: 1000000 },
  ];

  const tipoPrestamos = [];
  for (const tipo of tipos) {
    const [t, creado] = await TipoPrestamo.findOrCreate({ where: { nombre: tipo.nombre }, defaults: tipo });
    tipoPrestamos.push(t);
  }
  console.log('Catálogo de tipos de préstamo verificado/creado.');

  // Crear 10 préstamos con cuotas vencidas del mes pasado
  const hoy = new Date();
  const unMesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());

  for (let i = 0; i < 10; i++) {
    const socio = socios[i % socios.length];
    const tipo = tipoPrestamos[i % tipoPrestamos.length];

    const prestamo = await Prestamo.create({
      socioId: socio.id,
      tipoPrestamoId: tipo.id,
      montoSolicitado: 5000 + i * 5000,
      montoAprobado: 5000 + i * 5000,
      plazoMeses: 12,
      tasaInteresAnual: 12.00,
      estado: 'desembolsado',
      fechaSolicitud: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      fechaDesembolso: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    });

    // Generar 12 cuotas con fechas vencidas (del mes pasado)
    for (let j = 1; j <= 12; j++) {
      const fechaVencimiento = new Date(unMesAtras.getFullYear(), unMesAtras.getMonth() - j + 1, 15);
      // Ajustar si el día 15 es fin de semana
      if (fechaVencimiento.getDay() === 0) fechaVencimiento.setDate(fechaVencimiento.getDate() + 2); // mover al lunes
      if (fechaVencimiento.getDay() === 6) fechaVencimiento.setDate(fechaVencimiento.getDate() + 2); // mover al lunes

      const montoCapital = Math.round((5000 + i * 5000) / 12);
      const tasaMensual = 12.00 / 100 / 12;
      const interes = Math.round(montoCapital * tasaMensual);
      const montoTotal = montoCapital + interes;

      await Cuota.create({
        prestamoId: prestamo.id,
        numeroCuota: j,
        montoCapital,
        montoInteres: interes,
        montoTotal,
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        estado: 'vencida',
      });
    }

    console.log(`Préstamo ${i + 1} creado con 12 cuotas vencidas para socio ${socio.nombre}`);
  }

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Error en el seed:', err);
  process.exit(1);
});
