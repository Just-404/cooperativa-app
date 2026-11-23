export default function ChartSkeleton() {
  return (
    <div className="dashboard-chart-skeleton" role="status" aria-label="Cargando gráfico">
      <span className="dashboard-skeleton-chart-grid" aria-hidden="true" />
      <span className="dashboard-skeleton dashboard-skeleton-bar" aria-hidden="true" />
      <span className="dashboard-skeleton dashboard-skeleton-bar" aria-hidden="true" />
      <span className="dashboard-skeleton dashboard-skeleton-bar" aria-hidden="true" />
      <span className="dashboard-skeleton dashboard-skeleton-bar" aria-hidden="true" />
      <span className="dashboard-skeleton dashboard-skeleton-bar" aria-hidden="true" />
    </div>
  );
}
