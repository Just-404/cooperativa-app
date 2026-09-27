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
