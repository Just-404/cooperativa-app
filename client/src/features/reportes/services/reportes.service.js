import apiClient from '../../../services/apiClient';

export async function resumen() {
  const { data } = await apiClient.get('/reportes/resumen');
  return data;
}
export async function prestamosPorEstado() {
  const { data } = await apiClient.get('/reportes/prestamos-por-estado');
  return data;
}
