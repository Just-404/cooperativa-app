import apiClient from '../../../services/apiClient';

export async function listar() {
  const { data } = await apiClient.get('/prestamos');
  return data;
}
export async function obtener(id) {
  const { data } = await apiClient.get(`/prestamos/${id}`);
  return data;
}
export async function solicitar(payload) {
  const { data } = await apiClient.post('/prestamos', payload);
  return data;
}
export async function listarTipos() {
  const { data } = await apiClient.get('/tipos-prestamo');
  return data;
}
