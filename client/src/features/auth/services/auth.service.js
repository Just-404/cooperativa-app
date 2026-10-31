import apiClient from '../../../services/apiClient';

export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function recuperarContrasena(email) {
  const { data } = await apiClient.post('/auth/recuperar-contrasena', { email });
  return data;
}
