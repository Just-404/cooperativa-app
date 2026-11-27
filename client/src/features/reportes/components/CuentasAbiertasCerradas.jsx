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
import { cuentasMovimiento } from '../services/reportes.service';
import BotonDescarga from './BotonDescarga';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PERIODOS = [
  { valor: 3, etiqueta: 'Últimos 3 meses' },
  { valor: 6, etiqueta: 'Últimos 6 meses' },
  { valor: 12, etiqueta: 'Últimos 12 meses' },
];

export default function CuentasAbiertasCerradas() {
  const graficaRef = useRef(null);
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
  const hayGrafica = filasConDatos.length >= 3;
  const totalAbiertas = filasConDatos.reduce((suma, fila) => suma + Number(fila.Abiertas || 0), 0);
  const totalCerradas = filasConDatos.reduce((suma, fila) => suma + Number(fila.Cerradas || 0), 0);
  const neto = totalAbiertas - totalCerradas;
  const filasDescarga = filasConDatos.length
    ? [...filasConDatos, { nombre: 'Total', Abiertas: totalAbiertas, Cerradas: totalCerradas }]
    : [];

  return (
    <PanelCard
      titulo="Cuentas abiertas vs. cerradas"
      descripcion="Movimiento mensual de cuentas de ahorro."
      actions={(
        <>
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
          <BotonDescarga
            archivo="cuentas-abiertas-cerradas"
            titulo="Cuentas Abiertas vs. Cerradas"
            periodo={PERIODOS.find((periodo) => periodo.valor === meses).etiqueta}
            columnas={[
              { header: 'Mes', key: 'nombre' },
              { header: 'Abiertas', key: 'Abiertas' },
              { header: 'Cerradas', key: 'Cerradas' },
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
        <div
          ref={hayGrafica ? graficaRef : null}
          style={hayGrafica
            ? { padding: 12, height: 300, width: '100%' }
            : { width: '100%' }}
          aria-hidden="true"
        >
          {hayGrafica ? (
            <>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', marginBottom: 8 }}>
                <span>Total abiertas: <b style={{ color: COLORES_GRAFICOS.principal }}>{totalAbiertas}</b></span>
                <span>Total cerradas: <b style={{ color: COLORES_GRAFICOS.negativo }}>{totalCerradas}</b></span>
                <span>Neto: <b>{neto > 0 ? `+${neto}` : neto}</b></span>
              </div>
              <div className="dashboard-chart" role="img" aria-label="Comparación mensual de cuentas abiertas y cerradas">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos} margin={{ top: 20, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Abiertas" fill={COLORES_GRAFICOS.principal} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="Abiertas" position="top" fontSize={11} formatter={(valor) => valor || ''} isAnimationActive={false} />
                    </Bar>
                    <Bar dataKey="Cerradas" fill={COLORES_GRAFICOS.positivo} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="Cerradas" position="top" fontSize={11} formatter={(valor) => valor || ''} isAnimationActive={false} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : filasConDatos.length ? (
            <ul className="dashboard-compact-values" aria-label="Movimiento de cuentas por mes">
              {filasConDatos.map((fila) => (
                <li key={fila.nombre}>
                  <span>{fila.nombre}</span>
                  <strong>Abiertas {fila.Abiertas} · Cerradas {fila.Cerradas}</strong>
                </li>
              ))}
            </ul>
          ) : <EmptyState>No hay movimientos para el periodo seleccionado.</EmptyState>}
        </div>
      )}
    </PanelCard>
  );
}