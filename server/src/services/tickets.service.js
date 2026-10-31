const { Ticket } = require('../models');

async function crearTicket(datos) {
  return Ticket.create(datos);
}

async function listarTickets(filtro = {}) {
  const where = {};
  if (filtro.estado) where.estado = filtro.estado;
  if (filtro.tipo) where.tipo = filtro.tipo;
  if (filtro.usuarioId) where.usuarioId = filtro.usuarioId;

  return Ticket.findAll({ where, order: [['fechaCreacion', 'DESC']] });
}

async function actualizarTicket(id, datos) {
  const ticket = await Ticket.findByPk(id);
  if (!ticket) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }
  return ticket.update(datos);
}

async function obtenerTicket(id) {
  return Ticket.findByPk(id);
}

async function eliminarTicket(id) {
  const ticket = await Ticket.findByPk(id);
  if (!ticket) {
    const err = new Error('Ticket no encontrado');
    err.status = 404;
    throw err;
  }
  await ticket.destroy();
  return { id };
}

module.exports = { crearTicket, listarTickets, actualizarTicket, obtenerTicket, eliminarTicket };