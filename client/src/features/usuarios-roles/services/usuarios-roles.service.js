import apiClient from '../../../services/apiClient';

export async function listar() {
  const { data } = await apiClient.get('/usuarios');
  return data;
}
export async function crear(usuario) {
  const { data } = await apiClient.post('/usuarios', usuario);
  return data;
}
export async function actualizar(id, usuario) {
  const { data } = await apiClient.put(`/usuarios/${id}`, usuario);
  return data;
}
export async function cambiarEstado(id, activo) {
  const { data } = await apiClient.patch(`/usuarios/${id}/estado`, { activo });
  return data;
}
