import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: auditoria
export async function listar() {
  const { data } = await apiClient.get('/auditoria');
  return data;
}
