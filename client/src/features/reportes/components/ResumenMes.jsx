import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { prestamosDelMes } from '../services/reportes.service';
import BotonDescarga from './BotonDescarga';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const mesAnterior = ({ anio, mes }) =>
  mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };

const aValor = ({ anio, mes }) => `${anio}-${String(mes).padStart(2, '0')}`;

const deValor = (valor) => {
  const [anio, mes] = valor.split('-').map(Number);
  return { anio, mes };
};

function Variacion({ actual, previo, invertir = false }) {
  if (previo == null) return null;
  const diferencia = actual - previo;
  if (diferencia === 0) return <span className="dashboard-indicator-detail">Igual que el mes anterior</span>;
  const favorable = invertir ? diferencia < 0 : diferencia > 0;
  return (
    <span className={`dashboard-indicator-detail${favorable ? ' is-positive' : ' is-negative'}`}>
      {diferencia > 0 ? '+' : '−'}{Math.abs(diferencia)} frente al mes anterior
    </span>
  );
}

export default function ResumenMes() {
  const hoy = new Date();
  const [periodo, setPeriodo] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
  const [actual, setActual] = useState(null);
  const [previo, setPrevio] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const ant = mesAnterior(periodo);
    setCargando(true);
    setError('');
    setActual(null);
    setPrevio(null);

    Promise.all([
      prestamosDelMes(periodo.anio, periodo.mes),
      prestamosDelMes(ant.anio, ant.mes),
    ])
      .then(([mesActual, mesPrevio]) => {
        if (cancelado) return;
        setActual(mesActual);
        setPrevio(mesPrevio);
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err.response?.data?.error?.message || 'No se pudo cargar el resumen del mes.');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => { cancelado = true; };
  }, [periodo]);

  const mover = (delta) => setPeriodo(({ anio, mes }) => {
    const siguienteMes = mes + delta;
    if (siguienteMes < 1) return { anio: anio - 1, mes: 12 };
    if (siguienteMes > 12) return { anio: anio + 1, mes: 1 };
    return { anio, mes: siguienteMes };
  });

  const esMesActual = periodo.anio === hoy.getFullYear() && periodo.mes === hoy.getMonth() + 1;
  const maxValor = aValor({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
  const mesPrevio = mesAnterior(periodo);

  const onCambiarMes = (evento) => {
    if (!evento.target.value) return; // el usuario borró el campo
    setPeriodo(deValor(evento.target.value));
  };

  const resueltos = actual ? actual.aprobados + actual.rechazados : 0;
  const tasa = resueltos ? Math.round((actual.aprobados / resueltos) * 100) : 0;
  const datos = actual && previo ? [
    { etiqueta: 'Solicitados', actual: actual.solicitados, anterior: previo.solicitados },
    { etiqueta: 'Aprobados', actual: actual.aprobados, anterior: previo.aprobados },
    { etiqueta: 'Rechazados', actual: actual.rechazados, anterior: previo.rechazados },
  ] : [];
  const hayDatos = datos.some((fila) => fila.actual > 0 || fila.anterior > 0);

  const conceptos = [
    { k: 'solicitados', titulo: 'Solicitados' },
    { k: 'aprobados', titulo: 'Aprobados' },
    { k: 'rechazados', titulo: 'Rechazados' },
  ];
  const filasDescarga = actual ? [
    ...conceptos.map(({ k, titulo }) => ({
      concepto: titulo,
      cantidad: actual[k],
      anterior: previo?.[k] ?? '',
      variacion: previo ? actual[k] - previo[k] : '',
    })),
    { concepto: 'Resueltos (aprobados + rechazados)', cantidad: resueltos, anterior: '', variacion: '', resaltar: true },
    { concepto: 'Tasa de aprobación (%)', cantidad: tasa, anterior: '', variacion: '', resaltar: true },
  ] : [];

  return (
    <PanelCard
      titulo="Préstamos del mes"
      descripcion="Solicitudes y decisiones frente al mes anterior."
      actions={(
        <div className="resumen-mes-nav">
          <button type="button" onClick={() => mover(-1)} aria-label="Mes anterior">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <input
            type="month"
            className="mono dashboard-chart-control"
            value={aValor(periodo)}
            max={maxValor}
            onChange={onCambiarMes}
            aria-label="Seleccionar mes"
          />
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={esMesActual}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <BotonDescarga
            archivo="resumen-mes"
            titulo="Resumen del Mes"
            periodo={`${MESES[periodo.mes - 1]} ${periodo.anio}`}
            columnas={[
              { header: 'Concepto', key: 'concepto' },
              { header: 'Cantidad', key: 'cantidad' },
              { header: `Mes anterior (${MESES[mesPrevio.mes - 1]} ${mesPrevio.anio})`, key: 'anterior' },
              { header: 'Variación', key: 'variacion' },
            ]}
            filas={filasDescarga}
          />
        </div>
      )}
    >
      {error && <EmptyState error>{error}</EmptyState>}
      {cargando && !error && <ChartSkeleton />}
      {!cargando && !error && actual && previo && (
        <>
          <div className="dashboard-indicator-grid">
            <div className="dashboard-indicator">
              <strong>{actual.solicitados}</strong>
              <span>Solicitados</span>
              <Variacion actual={actual.solicitados} previo={previo.solicitados} />
            </div>
            <div className="dashboard-indicator">
              <strong>{actual.aprobados}</strong>
              <span>Aprobados</span>
              <Variacion actual={actual.aprobados} previo={previo.aprobados} />
            </div>
            <div className="dashboard-indicator">
              <strong>{actual.rechazados}</strong>
              <span>Rechazados</span>
              <Variacion actual={actual.rechazados} previo={previo.rechazados} invertir />
            </div>
            <div className="dashboard-indicator">
              <strong>{tasa}%</strong>
              <span>Tasa de aprobación de resueltos</span>
            </div>
          </div>

          {hayDatos && datos.filter((fila) => fila.actual > 0 || fila.anterior > 0).length >= 3 ? (
            <div className="dashboard-chart" role="img" aria-label="Comparación de solicitudes, aprobaciones y rechazos del mes actual y anterior">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="etiqueta" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="actual" name="Mes actual" fill={COLORES_GRAFICOS.principal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anterior" name="Mes anterior" fill={COLORES_GRAFICOS.positivo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : !hayDatos ? (
            <EmptyState>No hay préstamos registrados en estos meses.</EmptyState>
          ) : (
            <ul className="dashboard-compact-values" aria-label="Préstamos del mes frente al mes anterior">
              {datos.filter((fila) => fila.actual > 0 || fila.anterior > 0).map((fila) => (
                <li key={fila.etiqueta}>
                  <span>{fila.etiqueta}</span>
                  <strong>{fila.actual} actual · {fila.anterior} anterior</strong>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PanelCard>
  );
}
