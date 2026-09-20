import apiClient from '../../../services/apiClient';

// Llamadas a la API del módulo: usuarios-roles
export async function listar() {
  const { data } = await apiClient.get('/usuarios-roles');
  return data;
}
