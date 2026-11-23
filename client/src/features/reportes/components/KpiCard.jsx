import { Link } from 'react-router-dom';

export default function KpiCard({
  etiqueta,
  valor,
  detalle,
  href,
  destacado = false,
  alerta = false,
  cargando = false,
}) {
  const className = [
    'dashboard-kpi-card',
    destacado && 'is-featured',
    alerta && 'is-alert',
    href && 'is-link',
  ].filter(Boolean).join(' ');

  const contenido = (
    <>
      <span className="dashboard-kpi-label">{etiqueta}</span>
      {cargando ? (
        <span className="dashboard-skeleton dashboard-kpi-skeleton" aria-hidden="true" />
      ) : (
        <strong className="dashboard-kpi-value">{valor}</strong>
      )}
      {detalle && !cargando && <span className="dashboard-kpi-detail">{detalle}</span>}
      {cargando && <span className="sr-only">Cargando indicador</span>}
    </>
  );

  return href ? (
    <Link className={className} to={href}>
      {contenido}
    </Link>
  ) : (
    <article className={className}>{contenido}</article>
  );
}
