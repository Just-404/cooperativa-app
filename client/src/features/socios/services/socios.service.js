import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: socios
export async function listar() {
  const { data } = await apiClient.get('/socios');
  return data;
}
