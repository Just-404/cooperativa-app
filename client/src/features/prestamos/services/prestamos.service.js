import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: prestamos
export async function listar() {
  const { data } = await apiClient.get('/prestamos');
  return data;
}
