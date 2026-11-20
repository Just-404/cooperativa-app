const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');
const pagos = require('./services/pagos.service');
const { QueryTypes } = require('sequelize');

async function alinearLongitudTituloTickets() {
  const tablas = await sequelize.query(
    "SELECT to_regclass('public.tickets') AS tabla",
    { type: QueryTypes.SELECT }
  );

  if (!tablas[0]?.tabla) return;

  await sequelize.query(`
    UPDATE "tickets"
    SET "titulo" = LEFT("titulo", 45)
    WHERE "titulo" IS NOT NULL
      AND LENGTH("titulo") > 45
  `);
  await sequelize.query(
    'ALTER TABLE "tickets" ALTER COLUMN "titulo" TYPE VARCHAR(45)'
  );
  console.log('Título de tickets alineado a VARCHAR(45)');
}

async function start() {
  try {
    await sequelize.authenticate();
    await alinearLongitudTituloTickets();
    await sequelize.sync({ alter: env.nodeEnv !== 'production' });
    console.log('Conexión a la base de datos establecida');

    // Calcular mora automáticamente al iniciar: actualiza cuotas vencidas
    // con su monto de mora y las marca como 'vencida'
    try {
      const resultado = await pagos.calcularMora();
      console.log(`Mora calculada: ${resultado.cuotasEnMora} cuota(s) actualizada(s)`);
    } catch (err) {
      console.error('Error calculando mora al iniciar:', err.message);
    }

    app.listen(env.port, () => {
      console.log(`Servidor escuchando en el puerto ${env.port}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
