import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: auth
export async function listar() {
  const { data } = await apiClient.get('/auth');
  return data;
}
