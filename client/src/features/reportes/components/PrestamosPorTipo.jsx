import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COLORES_GRAFICOS } from '../../../utils/coloresGraficos.js';
import PanelCard from './PanelCard.jsx';
import EmptyState from './EmptyState.jsx';
import ChartSkeleton from './ChartSkeleton.jsx';
import { prestamosPorTipo } from '../services/reportes.service';

export default function PrestamosPorTipo() {
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    prestamosPorTipo()
      .then((resultado) => {
        if (!cancelado) setDatos(resultado);
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err.response?.data?.error?.message || 'No se pudo cargar el gráfico.');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => { cancelado = true; };
  }, []);

  const conDatos = datos.filter((item) => item.cantidad > 0);

  return (
    <PanelCard
      titulo="Préstamos por tipo"
      descripcion="Distribución de las solicitudes por categoría."
    >
      {error && <EmptyState error>{error}</EmptyState>}
      {cargando && !error && <ChartSkeleton />}
      {!cargando && !error && (
        conDatos.length >= 3 ? (
          <div className="dashboard-chart" role="img" aria-label="Distribución de préstamos por tipo">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conDatos} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nombre" width={140} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Solicitudes" fill={COLORES_GRAFICOS.principal} radius={[0, 5, 5, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : conDatos.length ? (
          <ul className="dashboard-compact-values" aria-label="Préstamos por tipo">
            {conDatos.map((item) => (
              <li key={item.nombre}><span>{item.nombre}</span><strong>{item.cantidad}</strong></li>
            ))}
          </ul>
        ) : <EmptyState>No hay préstamos por tipo para mostrar.</EmptyState>
      )}
    </PanelCard>
  );
}
