import apiClient from '../../../services/apiClient';

export async function listar() {
  const { data } = await apiClient.get('/auditoria');
  return data;
}
