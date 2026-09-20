const transaccionesService = require('../services/transacciones.service');

// Controlador del módulo: transacciones
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await transaccionesService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
