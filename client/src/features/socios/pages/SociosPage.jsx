import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listar, crear } from '../services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';

const POR_PAGINA = 10;
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '');

const VACIO = {
  nombre: '',
  apellido: '',
  documento: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
};

export default function SociosPage() {
  const { user } = useAuth();
  const [socios, setSocios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const puedeCrear = ['administrador', 'oficial_credito'].includes(user?.rol);

  function cargar() {
    setErrorLista('');
    listar()
      .then(setSocios)
      .catch(() => setErrorLista('No se pudieron cargar los socios'))
      .finally(() => setCargandoLista(false));
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await crear(form);
      setForm(VACIO);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo registrar el socio');
    } finally {
      setCargando(false);
    }
  }
  const estados = useMemo(
    () => [...new Set(socios.map((s) => s.estado).filter(Boolean))],
    [socios]
  );

  // El texto de búsqueda se calcula una sola vez por cambio en la lista.
  // Cédula y teléfono también se indexan sin guiones/espacios para que
  // "00112345678" encuentre "001-1234567-8".
  const indexados = useMemo(
    () =>
      socios.map((s) => ({
        s,
        texto: normalizar(
          [
            s.nombre, s.apellido,
            s.documento, soloDigitos(s.documento),
            s.email,
            s.telefono, soloDigitos(s.telefono),
          ].filter(Boolean).join(' ')
        ),
      })),
    [socios]
  );

  const filtrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return indexados
      .filter(({ s, texto }) =>
        (!estadoFiltro || s.estado === estadoFiltro) &&
        palabras.every((w) => texto.includes(w)))
      .map(({ s }) => s);
  }, [indexados, busqueda, estadoFiltro]);

  const { visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total } =
    usePaginacion(filtrados, POR_PAGINA, { reiniciarCon: [busqueda, estadoFiltro] });

  const hayFiltros = busqueda.trim() !== '' || estadoFiltro !== '';

  function limpiarFiltros() {
    setBusqueda('');
    setEstadoFiltro('');
  }

  function cerrarFormulario() {
    setForm(VACIO);
    setError('');
    setMostrarForm(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <h3>Socios</h3>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            {hayFiltros ? `${filtrados.length} de ${socios.length} socios` : `${socios.length} registrados`}
          </p>
        </div>
        {puedeCrear && (
          <button className="btn primary" onClick={() => { setError(''); setMostrarForm(true); }}>
            Nuevo socio
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !cargando) cerrarFormulario(); }}>
          <form onSubmit={handleSubmit} className="card socio-modal" aria-labelledby="nuevo-socio-titulo" role="dialog" aria-modal="true">
            <h3 id="nuevo-socio-titulo">Registrar socio</h3>
            <p className="socio-modal-description">Completa todos los datos del socio.</p>
            {error && <div className="alert error" role="alert">{error}</div>}
            <div className="socio-form-grid">
              <div className="field">
                <label htmlFor="socio-nombre">Nombre</label>
                <input id="socio-nombre" autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="socio-apellido">Apellido</label>
                <input id="socio-apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="socio-documento">Documento (cédula)</label>
                <input id="socio-documento" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="socio-email">Email</label>
                <input id="socio-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="socio-telefono">Teléfono</label>
                <input id="socio-telefono" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="socio-fecha-nacimiento">Fecha de nacimiento</label>
                <input id="socio-fecha-nacimiento" type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} required />
              </div>
              <div className="field socio-address-field">
                <label htmlFor="socio-direccion">Dirección</label>
                <input id="socio-direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} required />
              </div>
            </div>
            <div className="socio-modal-actions">
              <button className="btn secondary" type="button" onClick={cerrarFormulario} disabled={cargando}>Cancelar</button>
              <button className="btn primary" type="submit" disabled={cargando}>
                {cargando ? 'Guardando…' : 'Registrar socio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {errorLista && <div className="alert error">{errorLista}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por nombre, cédula, email o teléfono…"
          aria-label="Buscar socios"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') setBusqueda(''); }}
          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
        />
        <select
          aria-label="Filtrar por estado"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead>
          <tr><th>Nombre</th><th>Documento</th><th>Email</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          {visibles.map((s) => (
            <tr key={s.id}>
              <td>{s.nombre} {s.apellido}</td>
              <td className="mono">{s.documento}</td>
              <td>{s.email || '—'}</td>
              <td><EstadoTag estado={s.estado} /></td>
              <td><Link to={`/socios/${s.id}`}>Ver</Link></td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan="5" style={{ color: 'var(--ink-soft)' }}>
                {cargandoLista
                  ? 'Cargando…'
                  : socios.length === 0
                    ? 'Aún no hay socios registrados.'
                    : 'Ningún socio coincide con la búsqueda.'}</td></tr>
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
