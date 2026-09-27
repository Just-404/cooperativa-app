import apiClient from '../../../services/apiClient';

export async function listarPorCuenta(cuentaId) {
  const { data } = await apiClient.get(`/transacciones/cuenta/${cuentaId}`);
  return data;
}
export async function depositar(cuentaId, monto) {
  const { data } = await apiClient.post('/transacciones/depositos', { cuentaId, monto });
  return data;
}
export async function retirar(cuentaId, monto) {
  const { data } = await apiClient.post('/transacciones/retiros', { cuentaId, monto });
  return data;
}
