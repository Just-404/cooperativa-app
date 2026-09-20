import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: cuentas-ahorro
export async function listar() {
  const { data } = await apiClient.get('/cuentas-ahorro');
  return data;
}
