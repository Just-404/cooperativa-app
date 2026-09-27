import apiClient from '../../../services/apiClient';

export async function aprobar(prestamoId, montoAprobado, comentario) {
  const { data } = await apiClient.post(`/aprobacion/${prestamoId}/aprobar`, { montoAprobado, comentario });
  return data;
}
export async function rechazar(prestamoId, comentario) {
  const { data } = await apiClient.post(`/aprobacion/${prestamoId}/rechazar`, { comentario });
  return data;
}
