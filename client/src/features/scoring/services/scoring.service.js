import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: scoring
export async function listar() {
  const { data } = await apiClient.get('/scoring');
  return data;
}
