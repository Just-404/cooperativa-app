import apiClient from '../../../services/apiClient';

export async function evaluar(prestamoId, comentario) {
  const { data } = await apiClient.post(`/evaluacion/${prestamoId}/evaluar`, { comentario });
  return data;
}
