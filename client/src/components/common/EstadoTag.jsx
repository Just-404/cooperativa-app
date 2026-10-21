const MAPA = {
  activo: 'ok', activa: 'ok', pagada: 'ok', aprobado: 'ok', desembolsado: 'ok', cerrado: 'neutral',
  vencida: 'late', rechazado: 'late', inactivo: 'neutral', pendiente: 'wait',
  inactiva: 'neutral', cerrada: 'neutral', solicitado: 'wait', en_evaluacion: 'wait', evaluado: 'wait',
};

export default function EstadoTag({ estado }) {
  const clase = MAPA[estado] || 'neutral';
  const etiqueta = estado?.replace('_', ' ');
  const etiquetaCapitalizada = etiqueta
    ? etiqueta.charAt(0).toLocaleUpperCase('es') + etiqueta.slice(1)
    : '';
  return <span className={`tag-status ${clase}`}>{etiquetaCapitalizada}</span>;
}
