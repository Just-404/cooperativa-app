import apiClient from './apiClient';

export async function crearTicket(tipo, titulo, descripcion, usuarioNombre) {
  const { data } = await apiClient.post('/tickets', {
    tipo,
    titulo,
    descripcion,
    usuarioNombre,
  });
  return data;
}

export async function listarTickets(filtro = {}) {
  const params = new URLSearchParams();
  if (filtro.estado) params.append('estado', filtro.estado);
  if (filtro.tipo) params.append('tipo', filtro.tipo);
  
  const { data } = await apiClient.get(`/tickets?${params.toString()}`);
  return data;
}

export async function actualizarTicket(id, estado) {
  const { data } = await apiClient.patch(`/tickets/${id}`, { estado });
  return data;
}

export async function obtenerTicket(id) {
  const { data } = await apiClient.get(`/tickets/${id}`);
  return data;
}

export async function eliminarTicket(id) {
  const { data } = await apiClient.delete(`/tickets/${id}`);
  return data;
}