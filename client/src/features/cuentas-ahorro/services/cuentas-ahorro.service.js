import apiClient from '../../../services/apiClient';

export async function listarPorSocio(socioId) {
  const { data } = await apiClient.get(`/cuentas/socio/${socioId}`);
  return data;
}
export async function obtener(id) {
  const { data } = await apiClient.get(`/cuentas/${id}`);
  return data;
}
export async function abrir(socioId, saldoInicial) {
  const { data } = await apiClient.post('/cuentas', { socioId, saldoInicial });
  return data;
}

export async function cerrarCuenta(cuentaId){
  const {data} = await apiClient.delete(`/cuentas/socio/cerrarCuenta/${cuentaId}`);
  return data;
}

export async function cambiarEstado(cuentaId, estado) {
  const { data } = await apiClient.patch(`/cuentas/${cuentaId}/estado`, { estado });
  return data;
}