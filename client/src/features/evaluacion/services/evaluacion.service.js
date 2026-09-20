import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: evaluacion
export async function listar() {
  const { data } = await apiClient.get('/evaluacion');
  return data;
}
