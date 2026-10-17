import { useEffect, useState, useMemo } from 'react';
import { listar } from '../services/auditoria.service';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';

const POR_PAGINA = 15;
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');

  useEffect(() => {
    listar()
      .then(setEventos)
      .catch(() => setError('No se pudo cargar la auditoría'))
      .finally(() => setCargandoLista(false));
  }, []);

  const ordenados = useMemo(
    () => [...eventos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
    [eventos]
  );

  const roles = useMemo(
    () => [...new Set(eventos.map((e) => e.usuario?.rol).filter(Boolean))].sort(),
    [eventos]
  );

  const indexados = useMemo(
    () =>
      ordenados.map((e) => ({
        e,
        texto: normalizar(
          [new Date(e.fecha).toLocaleString(), e.usuario?.nombre, e.usuario?.rol, e.accion]
            .filter(Boolean)
            .join(' ')
        ),
      })),
    [ordenados]
  );

  const filtrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return indexados
      .filter(({ e, texto }) =>
        (!rolFiltro || e.usuario?.rol === rolFiltro) &&
        palabras.every((w) => texto.includes(w)))
      .map(({ e }) => e);
  }, [indexados, busqueda, rolFiltro]);

  const { visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total } =
    usePaginacion(filtrados, POR_PAGINA, { reiniciarCon: [busqueda, rolFiltro] });

  const hayFiltros = busqueda.trim() !== '' || rolFiltro !== '';

  function limpiarFiltros() {
    setBusqueda('');
    setRolFiltro('');
  }

  return (
    <div>
      <h3>Auditoría</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
        {hayFiltros
          ? `${filtrados.length} de ${eventos.length} acciones`
          : 'Últimas 200 acciones registradas en el sistema.'}
      </p>
      {error && <div className="alert error">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por usuario, acción o fecha…"
          aria-label="Buscar en la auditoría"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') setBusqueda(''); }}
          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
        />
        <select
          aria-label="Filtrar por rol"
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead>
        <tbody>
          {visibles.map((e) => (
            <tr key={e.id}>
              <td className="mono">{new Date(e.fecha).toLocaleString()}</td>
              <td>{e.usuario?.nombre || '—'}</td>
              <td>{e.accion}</td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan="3" style={{ color: 'var(--ink-soft)' }}>
                {cargandoLista
                  ? 'Cargando…'
                  : eventos.length === 0
                    ? 'Sin eventos registrados aún.'
                    : 'Ningún evento coincide con la búsqueda.'}
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
