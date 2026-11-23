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
import { cuentasMovimiento } from '../services/reportes.service';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PERIODOS = [
  { valor: 3, etiqueta: 'Últimos 3 meses' },
  { valor: 6, etiqueta: 'Últimos 6 meses' },
  { valor: 12, etiqueta: 'Últimos 12 meses' },
];

export default function CuentasAbiertasCerradas() {
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [meses, setMeses] = useState(6);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError('');

    cuentasMovimiento(meses)
      .then((filas) => {
        if (cancelado) return;
        setDatos(filas.map((fila) => {
          const [anio, mes] = fila.mes.split('-');
          return {
            nombre: `${MESES_CORTO[Number(mes) - 1]} ${anio.slice(2)}`,
            Abiertas: fila.abiertas,
            Cerradas: fila.cerradas,
          };
        }));
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

  const filasConDatos = datos.filter((fila) => fila.Abiertas > 0 || fila.Cerradas > 0);

  return (
    <PanelCard
      titulo="Cuentas abiertas vs. cerradas"
      descripcion="Movimiento mensual de cuentas de ahorro."
      actions={(
        <select
          className="dashboard-chart-control"
          value={meses}
          onChange={(event) => setMeses(Number(event.target.value))}
          aria-label="Periodo del gráfico de cuentas abiertas y cerradas"
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
          <div className="dashboard-chart" role="img" aria-label="Comparación mensual de cuentas abiertas y cerradas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Abiertas" fill={COLORES_GRAFICOS.principal} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cerradas" fill={COLORES_GRAFICOS.positivo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : filasConDatos.length ? (
          <ul className="dashboard-compact-values" aria-label="Movimiento de cuentas por mes">
            {filasConDatos.map((fila) => (
              <li key={fila.nombre}>
                <span>{fila.nombre}</span>
                <strong>Abiertas {fila.Abiertas} · Cerradas {fila.Cerradas}</strong>
              </li>
            ))}
          </ul>
        ) : <EmptyState>No hay movimientos para el periodo seleccionado.</EmptyState>
      )}
    </PanelCard>
  );
}
