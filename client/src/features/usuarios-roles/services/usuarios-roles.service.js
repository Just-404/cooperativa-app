import apiClient from '../../../services/apiClient';

export async function listar() {
  const { data } = await apiClient.get('/usuarios');
  return data;
}
export async function crear(usuario) {
  const { data } = await apiClient.post('/usuarios', usuario);
  return data;
}
