import apiClient from '../../../services/apiClient';

export async function listar() {
  const { data } = await apiClient.get('/socios');
  return data;
}
export async function obtener(id) {
  const { data } = await apiClient.get(`/socios/${id}`);
  return data;
}
export async function crear(socio) {
  const { data } = await apiClient.post('/socios', socio);
  return data;
}
export async function actualizar(id, socio) {
  const { data } = await apiClient.put(`/socios/${id}`, socio);
  return data;
}
export async function cambiarEstado(id, estado) {
  const { data } = await apiClient.patch(`/socios/${id}/estado`, { estado });
  return data;
}
