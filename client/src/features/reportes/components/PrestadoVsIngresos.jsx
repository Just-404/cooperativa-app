import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
import BotonDescarga from './BotonDescarga';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PERIODOS = [
  { valor: 3, etiqueta: 'Últimos 3 meses' },
  { valor: 6, etiqueta: 'Últimos 6 meses' },
  { valor: 12, etiqueta: 'Últimos 12 meses' },
];

const formatoMoneda = (valor) => `RD$ ${Number(valor).toLocaleString('es-DO')}`;

// Etiquetas compactas dentro de las barras: 1.2M, 350k
const compacto = (valor) => {
  const numero = Number(valor || 0);
  if (!numero) return '';
  if (numero >= 1_000_000) return `${(numero / 1_000_000).toFixed(1)}M`;
  if (numero >= 1_000) return `${Math.round(numero / 1_000)}k`;
  return numero;
};

export default function PrestadoVsIngresos() {
  const graficaRef = useRef(null);
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
  const totalPrestado = filasConDatos.reduce((suma, fila) => suma + Number(fila.Prestado || 0), 0);
  const totalIngresos = filasConDatos.reduce((suma, fila) => suma + Number(fila.Ingresos || 0), 0);
  const filasDescarga = filasConDatos.length
    ? [...filasConDatos, { nombre: 'Total', Prestado: totalPrestado, Ingresos: totalIngresos }]
    : [];

  return (
    <PanelCard
      titulo="Prestado vs. ingresos"
      descripcion="Montos desembolsados y pagos recibidos por mes."
      actions={(
        <>
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
          <BotonDescarga
            archivo="prestado-vs-ingresos"
            titulo="Prestado vs. Ingresos"
            periodo={PERIODOS.find((periodo) => periodo.valor === meses).etiqueta}
            columnas={[
              { header: 'Mes', key: 'nombre' },
              { header: 'Prestado (RD$)', key: 'Prestado', moneda: true },
              { header: 'Ingresos (RD$)', key: 'Ingresos', moneda: true },
            ]}
            filas={filasDescarga}
            grafica={graficaRef}
          />
        </>
      )}
    >
      {error && <EmptyState error>{error}</EmptyState>}
      {cargando && !error && <ChartSkeleton />}
      {!cargando && !error && (
        <div ref={graficaRef}>
          {filasConDatos.length >= 3 ? (
            <>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', marginBottom: 8 }}>
                <span>Total prestado: <b style={{ color: COLORES_GRAFICOS.principal }}>{formatoMoneda(totalPrestado)}</b></span>
                <span>Total ingresos: <b style={{ color: COLORES_GRAFICOS.positivo }}>{formatoMoneda(totalIngresos)}</b></span>
              </div>
              <div className="dashboard-chart" role="img" aria-label="Comparación mensual de montos prestados e ingresos">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos} margin={{ top: 20, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis tickFormatter={(valor) => (valor >= 1000 ? `${valor / 1000}k` : valor)} />
                    <Tooltip formatter={(valor) => formatoMoneda(valor)} />
                    <Legend />
                    <Bar dataKey="Prestado" fill={COLORES_GRAFICOS.principal} radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Prestado" position="top" fontSize={10} formatter={compacto} />
                    </Bar>
                    <Bar dataKey="Ingresos" fill={COLORES_GRAFICOS.positivo} radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Ingresos" position="top" fontSize={10} formatter={compacto} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : filasConDatos.length ? (
            <ul className="dashboard-compact-values" aria-label="Montos prestados e ingresos del periodo">
              {filasConDatos.map((fila) => (
                <li key={fila.nombre}>
                  <span>{fila.nombre}</span>
                  <strong>Prestado {formatoMoneda(fila.Prestado)} · Ingresos {formatoMoneda(fila.Ingresos)}</strong>
                </li>
              ))}
            </ul>
          ) : <EmptyState>No hay movimientos para el periodo seleccionado.</EmptyState>}
        </div>
      )}
    </PanelCard>
  );
}
