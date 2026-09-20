import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: aprobacion
export async function listar() {
  const { data } = await apiClient.get('/aprobacion');
  return data;
}
