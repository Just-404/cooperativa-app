import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: desembolso
export async function listar() {
  const { data } = await apiClient.get('/desembolso');
  return data;
}
