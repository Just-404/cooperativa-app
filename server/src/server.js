const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');
const pagos = require('./services/pagos.service');

async function start() {
  try {
    await sequelize.authenticate();
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
