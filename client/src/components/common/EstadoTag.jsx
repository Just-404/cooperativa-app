const MAPA = {
  activo: 'ok', activa: 'ok', pagada: 'ok', aprobado: 'ok', desembolsado: 'ok', cerrado: 'neutral',
  vencida: 'late', rechazado: 'late', inactivo: 'neutral', pendiente: 'wait',
  inactiva: 'neutral', cerrada: 'neutral', solicitado: 'wait', evaluado: 'wait',
};
const ETIQUETAS = {
  evaluado: 'Evaluación',
};

export default function EstadoTag({ estado, resaltado = false }) {
  const clase = MAPA[estado] || 'neutral';
  const etiqueta = ETIQUETAS[estado] || estado?.replace('_', ' ');
  const etiquetaCapitalizada = etiqueta
    ? etiqueta.charAt(0).toLocaleUpperCase('es') + etiqueta.slice(1)
    : '';
  return <span className={`tag-status ${clase}${resaltado ? ' actionable' : ''}`}>{etiquetaCapitalizada}</span>;
}
