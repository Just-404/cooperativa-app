import apiClient from '../../../services/apiClient';

export async function resumen() {
  const { data } = await apiClient.get('/reportes/resumen');
  return data;
}
export async function prestamosPorEstado() {
  const { data } = await apiClient.get('/reportes/prestamos-por-estado');
  return data;
} export async function prestamosDelMes(anio, mes) {
  const hoy = new Date();
  const { data } = await apiClient.get('/reportes/prestamos-del-mes', {
    params: {
      anio: anio ?? hoy.getFullYear(),
      mes: mes ?? hoy.getMonth() + 1,
    },
  });
  return data;
}
export async function prestadoVsIngresos(meses = 6) {
  const { data } = await apiClient.get('/reportes/prestado-vs-ingresos', { params: { meses } });
  return data;
}