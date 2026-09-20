const usuariosService = require('../services/usuarios.service');

// Controlador del módulo: usuarios
// TODO: implementar los endpoints correspondientes a este módulo

async function listar(req, res, next) {
  try {
    const data = await usuariosService.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
