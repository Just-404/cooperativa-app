import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listarEnMora } from '../services/cuotas-pagos.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';

const POR_PAGINA = 10;
const MS_DIA = 24 * 60 * 60 * 1000;

const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '');

const TRAMOS = [
  { value: '1-30', label: '1 a 30 días', min: 1, max: 30 },
  { value: '31-60', label: '31 a 60 días', min: 31, max: 60 },
  { value: '61-90', label: '61 a 90 días', min: 61, max: 90 },
  { value: '90+', label: 'Más de 90 días', min: 91, max: Infinity },
];

function diasAtraso(fechaVencimiento) {
  const dias = Math.floor((Date.now() - new Date(fechaVencimiento).getTime()) / MS_DIA);
  return Math.max(0, dias);
}


export default function CuotasPagosPage() {
  const [cuotas, setCuotas] = useState([]);
  const [error, setError] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [tramoFiltro, setTramoFiltro] = useState('');

  useEffect(() => {
    listarEnMora()
      .then(setCuotas)
      .catch(() => setError('No se pudo cargar la mora'))
      .finally(() => setCargandoLista(false));
  }, []);

  const indexadas = useMemo(
    () =>
      cuotas
        .map((c) => {
          const socio = c.prestamo?.socio;
          return {
            c,
            dias: diasAtraso(c.fechaVencimiento),
            texto: normalizar(
              [
                socio?.nombre, socio?.apellido,
                socio?.documento, soloDigitos(socio?.documento),
                c.numeroCuota,
                c.montoTotal, Number(c.montoTotal).toLocaleString(),
                c.montoMora, Number(c.montoMora || 0).toLocaleString(),
              ].filter((x) => x !== undefined && x !== null && x !== '').join(' ')
            ),
          };
        })
        .sort((a, b) => b.dias - a.dias),
    [cuotas]
  );

  const filtradas = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    const tramo = TRAMOS.find((t) => t.value === tramoFiltro);
    return indexadas
      .filter(({ dias, texto }) =>
        (!tramo || (dias >= tramo.min && dias <= tramo.max)) &&
        palabras.every((w) => texto.includes(w)));
  }, [indexadas, busqueda, tramoFiltro]);

  const totalAdeudado = useMemo(
    () => filtradas.reduce((acc, { c }) => acc + Number(c.montoTotal || 0) + Number(c.montoMora || 0), 0),
    [filtradas]
  );

  const { visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total } =
    usePaginacion(filtradas, POR_PAGINA, { reiniciarCon: [busqueda, tramoFiltro] });

  const hayFiltros = busqueda.trim() !== '' || tramoFiltro !== '';

  function limpiarFiltros() {
    setBusqueda('');
    setTramoFiltro('');
  }

  return (
    <div>
      <h3>Cuotas en mora</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
        Para registrar un pago, entra al préstamo correspondiente desde su detalle.
      </p>
      {error && <div className="alert error">{error}</div>}
      {cuotas.length > 0 && (
        <p style={{ margin: '0 0 14px' }}>
          {hayFiltros ? `${filtradas.length} de ${cuotas.length} cuotas` : `${cuotas.length} cuotas`} ·{' '}
          <span className="mono">RD$ {totalAdeudado.toLocaleString()}</span> adeudados (monto + mora)
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por socio, cédula, cuota o monto…"
          aria-label="Buscar cuotas en mora"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') setBusqueda(''); }}
          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
        />
        <select
          aria-label="Filtrar por días de atraso"
          value={tramoFiltro}
          onChange={(e) => setTramoFiltro(e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los atrasos</option>
          {TRAMOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead>
          <tr>
            <th>Prestamo #</th><th>Socio</th><th>Cuota #</th><th>Vencimiento</th><th>Atraso</th>
            <th>Monto</th><th>Mora</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          {visibles.map(({ c, dias }) => (
            <tr key={c.id}>
              <td>{c.prestamo?.id?.slice(0, 8)}</td>
              <td>{c.prestamo?.socio?.nombre} {c.prestamo?.socio?.apellido}</td>
              <td>{c.numeroCuota}</td>
              <td>{new Date(c.fechaVencimiento).toLocaleDateString()}</td>
              <td>{dias} {dias === 1 ? 'día' : 'días'}</td>
              <td className="mono">{Number(c.montoTotal).toLocaleString()}</td>
              <td className="mono">{Number(c.montoMora || 0).toLocaleString()}</td>
              <td><EstadoTag estado={c.estado} /></td>
              <td><Link to={`/prestamos/${c.prestamo?.id}`}>Ver préstamo</Link></td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan="8" style={{ color: 'var(--ink-soft)' }}>
                {cargandoLista
                  ? 'Cargando…'
                  : cuotas.length === 0
                    ? 'No hay cuotas en mora.'
                    : 'Ninguna cuota coincide con la búsqueda.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Paginacion
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onCambiar={setPagina}
        desde={desde}
        hasta={hasta}
        total={total}
      />
    </div>
  );
}
