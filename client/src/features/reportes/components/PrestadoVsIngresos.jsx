import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COLORES_GRAFICOS } from '../../../utils/coloresGraficos.js';
import PanelCard from './PanelCard.jsx';
import EmptyState from './EmptyState.jsx';
import ChartSkeleton from './ChartSkeleton.jsx';
import { prestadoVsIngresos } from '../services/reportes.service';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PERIODOS = [
  { valor: 3, etiqueta: 'Últimos 3 meses' },
  { valor: 6, etiqueta: 'Últimos 6 meses' },
  { valor: 12, etiqueta: 'Últimos 12 meses' },
];

const formatoMoneda = (valor) => `RD$ ${Number(valor).toLocaleString('es-DO')}`;

export default function PrestadoVsIngresos() {
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [meses, setMeses] = useState(6);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError('');

    prestadoVsIngresos(meses)
      .then((filas) => {
        if (cancelado) return;
        setDatos(filas.map((fila) => ({
          nombre: `${MESES_CORTO[fila.mes - 1]} ${String(fila.anio).slice(2)}`,
          Prestado: fila.prestado,
          Ingresos: fila.ingresos,
        })));
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
  }, [meses]);

  const filasConDatos = datos.filter((fila) => fila.Prestado > 0 || fila.Ingresos > 0);

  return (
    <PanelCard
      titulo="Prestado vs. ingresos"
      descripcion="Montos desembolsados y pagos recibidos por mes."
      actions={(
        <select
          className="dashboard-chart-control"
          value={meses}
          onChange={(event) => setMeses(Number(event.target.value))}
          aria-label="Periodo del gráfico prestado e ingresos"
        >
          {PERIODOS.map((periodo) => (
            <option key={periodo.valor} value={periodo.valor}>{periodo.etiqueta}</option>
          ))}
        </select>
      )}
    >
      {error && <EmptyState error>{error}</EmptyState>}
      {cargando && !error && <ChartSkeleton />}
      {!cargando && !error && (
        filasConDatos.length >= 3 ? (
          <div className="dashboard-chart" role="img" aria-label="Comparación mensual de montos prestados e ingresos">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis
                  tickFormatter={(valor) => (valor >= 1000 ? `${valor / 1000}k` : valor)}
                />
                <Tooltip formatter={(valor) => formatoMoneda(valor)} />
                <Legend />
                <Bar dataKey="Prestado" fill={COLORES_GRAFICOS.principal} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ingresos" fill={COLORES_GRAFICOS.positivo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : filasConDatos.length ? (
          <ul className="dashboard-compact-values" aria-label="Montos prestados e ingresos del periodo">
            {filasConDatos.map((fila) => (
              <li key={fila.nombre}>
                <span>{fila.nombre}</span>
                <strong>Prestado {formatoMoneda(fila.Prestado)} · Ingresos {formatoMoneda(fila.Ingresos)}</strong>
              </li>
            ))}
          </ul>
        ) : <EmptyState>No hay movimientos para el periodo seleccionado.</EmptyState>
      )}
    </PanelCard>
  );
}
