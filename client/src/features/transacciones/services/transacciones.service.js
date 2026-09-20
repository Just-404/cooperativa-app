import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: transacciones
export async function listar() {
  const { data } = await apiClient.get('/transacciones');
  return data;
}
