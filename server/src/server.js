const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: env.nodeEnv !== 'production' });
    console.log('Conexión a la base de datos establecida');

    app.listen(env.port, () => {
      console.log(`Servidor escuchando en el puerto ${env.port}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
