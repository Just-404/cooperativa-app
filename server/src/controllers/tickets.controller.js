const ticketsService = require('../services/tickets.service');
const { Usuario } = require('../models');

async function crearTicket(req, res, next) {
  try {
    const { tipo, titulo, descripcion } = req.body;
    const usuarioId = req.user.id;

    const ticket = await ticketsService.crearTicket({
      usuarioId,
      tipo,
      titulo,
      descripcion,
    });

    res.status(201).json({
      mensaje: 'Ticket creado exitosamente',
      ticket: {
        id: ticket.id,
        tipo: ticket.tipo,
        titulo: ticket.titulo,
        estado: ticket.estado,
        fechaCreacion: ticket.fechaCreacion,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listarTickets(req, res, next) {
  try {
    const { estado, tipo } = req.query;
    const filtro = {};

    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;

    const tickets = await ticketsService.listarTickets(filtro);

    // Obtener nombres de usuarios sin depender de asociaciones de Sequelize
    // (evita problemas de llave foránea al sincronizar la base de datos)
    const usuarioIds = [...new Set(tickets.map((t) => t.usuarioId).filter(Boolean))];
    const usuarios = usuarioIds.length > 0
      ? await Usuario.findAll({ where: { id: usuarioIds }, attributes: ['id', 'nombre'] })
      : [];
    const usuarioMap = {};
    usuarios.forEach((u) => { usuarioMap[u.id] = u.nombre; });

    res.json({
      total: tickets.length,
      tickets: tickets.map((t) => ({
        id: t.id,
        tipo: t.tipo,
        titulo: t.titulo,
        descripcion: t.descripcion,
        estado: t.estado,
        usuarioId: t.usuarioId,
        usuarioNombre: usuarioMap[t.usuarioId] || null,
        fechaCreacion: t.fechaCreacion,
        fechaResolucion: t.fechaResolucion,
        usuarioAdmin: t.usuarioAdmin,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function obtenerTicket(req, res, next) {
  try {
    const ticket = await ticketsService.obtenerTicket(req.params.id);

    res.json({
      ticket: {
        id: ticket.id,
        usuarioId: ticket.usuarioId,
        tipo: ticket.tipo,
        titulo: ticket.titulo,
        descripcion: ticket.descripcion,
        estado: ticket.estado,
        fechaCreacion: ticket.fechaCreacion,
        fechaResolucion: ticket.fechaResolucion,
        usuarioAdmin: ticket.usuarioAdmin,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function actualizarTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const ticket = await ticketsService.actualizarTicket(id, { estado });

    let mensaje = '';
    if (estado === 'resolved') {
      mensaje = 'Ticket marcado como resuelto';
    } else if (estado === 'cancelled') {
      mensaje = 'Ticket cancelado';
    } else {
      mensaje = 'Ticket actualado a pendiente';
    }

    res.json({
      mensaje,
      ticket: {
        id: ticket.id,
        estado: ticket.estado,
        usuarioAdmin: ticket.usuarioAdmin,
        fechaResolucion: ticket.fechaResolucion,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function eliminarTicket(req, res, next) {
  try {
    const { id } = req.params;

    await ticketsService.eliminarTicket(id);

    res.json({
      mensaje: 'Ticket eliminado exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { crearTicket, listarTickets, obtenerTicket, actualizarTicket, eliminarTicket };