import apiClient from '../../../services/apiClient';

export async function listarCuotas(prestamoId) {
  const { data } = await apiClient.get(`/cuotas/prestamo/${prestamoId}`);
  return data;
}
export async function registrarPago(cuotaId, monto) {
  const { data } = await apiClient.post('/pagos', { cuotaId, monto });
  return data;
}
export async function registrarAbonoCapital(prestamoId, monto) {
  const { data } = await apiClient.post('/pagos/abono-capital', { prestamoId, monto });
  return data;
}
export async function listarEnMora() {
  const { data } = await apiClient.get('/pagos/mora');
  return data;
}

export async function recalcularFechasCuotas(prestamoId) {
  const { data } = await apiClient.post(`/cuotas/prestamo/${prestamoId}/recalcular-fechas`);
  return data;
}
