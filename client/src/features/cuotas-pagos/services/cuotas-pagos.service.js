import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: cuotas-pagos
export async function listar() {
  const { data } = await apiClient.get('/cuotas-pagos');
  return data;
}
