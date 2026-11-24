import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COLORES_GRAFICOS } from '../../../utils/coloresGraficos.js';
import PanelCard from './PanelCard.jsx';
import EmptyState from './EmptyState.jsx';
import ChartSkeleton from './ChartSkeleton.jsx';
import { prestamosPorTipo } from '../services/reportes.service';
import BotonDescarga from './BotonDescarga';

export default function PrestamosPorTipo() {
  const graficaRef = useRef(null);
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
  const total = conDatos.reduce((suma, item) => suma + Number(item.cantidad || 0), 0);
  const masUsado = conDatos[0];
  const menosUsado = conDatos[conDatos.length - 1];
  const filasDescarga = datos.length
    ? [...datos, { nombre: 'Total', cantidad: total }]
    : [];

  return (
    <PanelCard
      titulo="Préstamos por tipo"
      descripcion="Distribución de las solicitudes por categoría."
      actions={(
        <BotonDescarga
          archivo="prestamos-por-tipo"
          titulo="Préstamos por Tipo"
          periodo="-"
          columnas={[
            { header: 'Tipo', key: 'nombre' },
            { header: 'Cantidad', key: 'cantidad' },
          ]}
          filas={filasDescarga}
          grafica={graficaRef}
        />
      )}
    >
      {error && <EmptyState error>{error}</EmptyState>}
      {cargando && !error && <ChartSkeleton />}
      {!cargando && !error && (
        <div ref={graficaRef}>
          {conDatos.length >= 3 ? (
            <>
              {masUsado && menosUsado && (
                <p style={{ fontSize: '0.8rem', margin: '0 0 8px' }}>
                  Más usado: <b>{masUsado.nombre}</b> ({masUsado.cantidad}) ·
                  Menos usado: <b>{menosUsado.nombre}</b> ({menosUsado.cantidad}) ·
                  Total: <b style={{ color: COLORES_GRAFICOS.principal }}>{total}</b>
                </p>
              )}
              <div className="dashboard-chart" role="img" aria-label="Distribución de préstamos por tipo">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conDatos} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 4 }}>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nombre" width={140} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="cantidad" name="Solicitudes" fill={COLORES_GRAFICOS.principal} radius={[0, 5, 5, 0]} maxBarSize={26}>
                      <LabelList dataKey="cantidad" position="right" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : conDatos.length ? (
            <ul className="dashboard-compact-values" aria-label="Préstamos por tipo">
              {conDatos.map((item) => (
                <li key={item.nombre}><span>{item.nombre}</span><strong>{item.cantidad}</strong></li>
              ))}
            </ul>
          ) : <EmptyState>No hay préstamos por tipo para mostrar.</EmptyState>}
        </div>
      )}
    </PanelCard>
  );
}
