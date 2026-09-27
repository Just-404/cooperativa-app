import apiClient from '../../../services/apiClient';

export async function obtenerPorSocio(socioId) {
  const { data } = await apiClient.get(`/scoring/socio/${socioId}`);
  return data;
}
export async function calcular(socioId) {
  const { data } = await apiClient.post(`/scoring/socio/${socioId}/calcular`);
  return data;
}
