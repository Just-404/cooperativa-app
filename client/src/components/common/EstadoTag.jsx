const MAPA = {
  activo: 'ok', activa: 'ok', pagada: 'ok', aprobado: 'ok', desembolsado: 'ok', cerrado: 'neutral',
  vencida: 'late', rechazado: 'late', inactivo: 'neutral', pendiente: 'wait',
  solicitado: 'wait', en_evaluacion: 'wait', evaluado: 'wait',
};

export default function EstadoTag({ estado }) {
  const clase = MAPA[estado] || 'neutral';
  return <span className={`tag-status ${clase}`}>{estado?.replace('_', ' ')}</span>;
}
