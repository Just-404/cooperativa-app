import apiClient from '../../../services/apiClient';

export async function obtener(anio) {
  const { data } = await apiClient.get('/configuracion', { params: anio ? { anio } : {} });
  return data;
}

export async function crearFeriado(feriado) {
  const { data } = await apiClient.post('/configuracion/feriados', feriado);
  return data;
}

export async function actualizarFeriado(id, cambios) {
  const { data } = await apiClient.put(`/configuracion/feriados/${id}`, cambios);
  return data;
}

export async function eliminarFeriado(id) {
  const { data } = await apiClient.delete(`/configuracion/feriados/${id}`);
  return data;
}

export async function restaurarFeriados(anio) {
  const { data } = await apiClient.post('/configuracion/feriados/restaurar', { anio });
  return data;
}

export async function actualizarDiasNoLaborables(diasNoLaborables) {
  const { data } = await apiClient.put('/configuracion/dias-no-laborables', { diasNoLaborables });
  return data;
}

export async function listarTasas() {
  const { data } = await apiClient.get('/configuracion/mora');
  return data;
}

export async function actualizarTasaMora(tasaMensual) {
  const { data } = await apiClient.put('/configuracion/mora', { tasaMensual });
  return data;
}

export async function previsualizarRecalculo() {
  const { data } = await apiClient.get('/configuracion/recalcular-cuotas/preview');
  return data;
}

export async function recalcularCuotas() {
  const { data } = await apiClient.post('/configuracion/recalcular-cuotas');
  return data;
}
