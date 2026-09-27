import apiClient from '../../../services/apiClient';

export async function desembolsar(prestamoId) {
  const { data } = await apiClient.post(`/desembolso/${prestamoId}/desembolsar`);
  return data;
}
