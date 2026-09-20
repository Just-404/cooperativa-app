import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: reportes
export async function listar() {
  const { data } = await apiClient.get('/reportes');
  return data;
}
