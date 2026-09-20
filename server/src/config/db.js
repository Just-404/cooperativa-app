const { Sequelize } = require('sequelize');
const env = require('./env');

// Conexión a la base de datos PostgreSQL vía Sequelize
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;
