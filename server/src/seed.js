// Script de semilla: crea el usuario administrador inicial y catálogos base.
// Uso: npm run seed  (después de tener la base de datos accesible)
const { sequelize, Usuario, TipoPrestamo } = require('./models');

async function seed() {
  await sequelize.sync({ alter: true });

  const [admin, creado] = await Usuario.findOrCreate({
    where: { email: 'admin@cooperativa.com' },
    defaults: {
      nombre: 'Administrador General',
      email: 'admin@cooperativa.com',
      password: 'Admin123!',
      rol: 'administrador',
    },
  });

  if (creado) {
    console.log('Usuario administrador creado -> admin@cooperativa.com / Admin123!');
  } else {
    console.log('El usuario administrador ya existía, no se modificó.');
  }

  const tipos = [
    { nombre: 'Préstamo personal', tasaInteresAnual: 18, plazoMaximoMeses: 24, montoMinimo: 5000, montoMaximo: 150000 },
    { nombre: 'Préstamo hipotecario', tasaInteresAnual: 10, plazoMaximoMeses: 180, montoMinimo: 200000, montoMaximo: 3000000 },
    { nombre: 'Préstamo comercial', tasaInteresAnual: 14, plazoMaximoMeses: 60, montoMinimo: 50000, montoMaximo: 1000000 },
  ];

  for (const tipo of tipos) {
    await TipoPrestamo.findOrCreate({ where: { nombre: tipo.nombre }, defaults: tipo });
  }
  console.log('Catálogo de tipos de préstamo verificado/creado.');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('Error en el seed:', err);
  process.exit(1);
});
