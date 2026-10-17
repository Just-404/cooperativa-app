import { useEffect, useState, useMemo } from 'react';
import { listar, crear } from '../services/usuarios-roles.service';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';

const POR_PAGINA = 10;
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const VACIO = { nombre: '', email: '', password: '', rol: 'cajero' };
const ROLES = ['administrador', 'cajero', 'oficial_credito', 'gerente', 'auditor'];
const etiquetaRol = (r) => String(r ?? '').replace(/_/g, ' ');

export default function UsuariosRolesPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [errorLista, setErrorLista] = useState('');   // ← añadir

  function cargar() {
    setErrorLista('');                                // ← añadir
    listar()
      .then(setUsuarios)
      .catch(() => setErrorLista('No se pudieron cargar los usuarios'))
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
      setError(err.response?.data?.error?.message || 'No se pudo crear el usuario');
    } finally {
      setCargando(false);
    }
  }

  const indexados = useMemo(
    () =>
      [...usuarios]
        .sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''), 'es'))
        .map((u) => ({
          u,
          texto: normalizar([u.nombre, u.email].filter(Boolean).join(' ')),
        })),
    [usuarios]
  );

  const filtrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return indexados
      .filter(({ u, texto }) =>
        (!rolFiltro || u.rol === rolFiltro) &&
        (!estadoFiltro || (estadoFiltro === 'activo') === Boolean(u.activo)) &&
        palabras.every((w) => texto.includes(w)))
      .map(({ u }) => u);
  }, [indexados, busqueda, rolFiltro, estadoFiltro]);

  const { visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total } =
    usePaginacion(filtrados, POR_PAGINA, { reiniciarCon: [busqueda, rolFiltro, estadoFiltro] });

  const hayFiltros = busqueda.trim() !== '' || rolFiltro !== '' || estadoFiltro !== '';

  function limpiarFiltros() {
    setBusqueda('');
    setRolFiltro('');
    setEstadoFiltro('');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <h3>Usuarios del sistema</h3>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            {hayFiltros ? `${filtrados.length} de ${usuarios.length} usuarios` : `${usuarios.length} registrados`}
          </p>
        </div>
        <button className="btn primary" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : 'Nuevo usuario'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 22, maxWidth: 420 }}>
          {error && <div className="alert error">{error}</div>}
          <div className="field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Contraseña temporal</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="btn primary" type="submit" disabled={cargando}>
            {cargando ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>
      )}

      {errorLista && <div className="alert error">{errorLista}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          aria-label="Buscar usuarios"
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
          {ROLES.map((r) => <option key={r} value={r}>{etiquetaRol(r)}</option>)}
        </select>
        <select
          aria-label="Filtrar por estado"
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr></thead>
        <tbody>
          {visibles.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td className="mono">{u.rol}</td>
              <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan="4" style={{ color: 'var(--ink-soft)' }}>
                {cargandoLista
                  ? 'Cargando…'
                  : usuarios.length === 0
                    ? 'Aún no hay usuarios registrados.'
                    : 'Ningún usuario coincide con la búsqueda.'}
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
