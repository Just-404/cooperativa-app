import { useEffect, useState, useMemo } from 'react';
import { listar, crear, actualizar, cambiarEstado } from '../services/usuarios-roles.service';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const POR_PAGINA = 10;
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const VACIO = { nombre: '', email: '', password: '', rol: 'cajero' };
const ROLES = ['administrador', 'cajero', 'oficial_credito', 'gerente', 'auditor'];
const etiquetaRol = (r) => String(r ?? '').replace(/_/g, ' ');

export default function UsuariosRolesPage() {
  const { user: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
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
      if (usuarioEditando) {
        await actualizar(usuarioEditando.id, form);
      } else {
        await crear(form);
      }
      setForm(VACIO);
      setMostrarForm(false);
      setUsuarioEditando(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || `No se pudo ${usuarioEditando ? 'actualizar' : 'crear'} el usuario`);
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

  function cerrarFormulario() {
    setForm(VACIO);
    setError('');
    setMostrarForm(false);
    setUsuarioEditando(null);
  }

  function editarUsuario(usuario) {
    if (!usuario.activo) {
      setError('No se puede editar un usuario desactivado. Actívalo primero.');
      return;
    }
    setUsuarioEditando(usuario);
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
    });
    setError('');
    setMostrarForm(true);
  }

  function solicitarCambioEstado(usuario) {
    if (usuario.id === usuarioActual?.id && usuario.activo) {
      setError('No puedes desactivar tu propio usuario.');
      return;
    }
    setError('');
    setConfirmacion({
      usuario,
      activo: !usuario.activo,
      titulo: usuario.activo ? '¿Desactivar este usuario?' : '¿Activar este usuario?',
      mensaje: usuario.activo
        ? `Se desactivará el acceso de ${usuario.nombre} al sistema.`
        : `Se reactivará el acceso de ${usuario.nombre} al sistema.`,
      confirmarTexto: usuario.activo ? 'Desactivar usuario' : 'Activar usuario',
      peligro: usuario.activo,
    });
  }

  async function confirmarCambioEstado() {
    if (!confirmacion) return;
    setCargando(true);
    setError('');
    try {
      await cambiarEstado(confirmacion.usuario.id, confirmacion.activo);
      setConfirmacion(null);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo cambiar el estado del usuario');
      setConfirmacion(null);
    } finally {
      setCargando(false);
    }
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
        <button className="btn primary" onClick={() => { setUsuarioEditando(null); setForm(VACIO); setError(''); setMostrarForm(true); }}>
          Nuevo usuario
        </button>
      </div>

      {mostrarForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !cargando) cerrarFormulario(); }}>
          <form onSubmit={handleSubmit} className="card socio-modal" aria-labelledby="usuario-form-titulo" role="dialog" aria-modal="true">
            <h3 id="usuario-form-titulo">{usuarioEditando ? 'Editar usuario' : 'Crear usuario'}</h3>
            <p className="socio-modal-description">
              {usuarioEditando ? 'Actualiza los datos de acceso del usuario.' : 'Completa los datos de acceso del usuario.'}
            </p>
            {error && <div className="alert error" role="alert">{error}</div>}
            <div className="field">
              <label htmlFor="usuario-nombre">Nombre</label>
              <input id="usuario-nombre" autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required maxLength={255} />
            </div>
            <div className="field">
              <label htmlFor="usuario-email">Email</label>
              <input id="usuario-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
            </div>
            <div className="field">
              <label htmlFor="usuario-password">{usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}</label>
              <input
                id="usuario-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!usuarioEditando}
                minLength={8}
                autoComplete="new-password"
              />
              {usuarioEditando && <small>Déjala en blanco para conservar la contraseña actual.</small>}
            </div>
            <div className="field">
              <label htmlFor="usuario-rol">Rol</label>
              <select id="usuario-rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} required>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="socio-modal-actions">
              <button className="btn secondary" type="button" onClick={cerrarFormulario} disabled={cargando}>Cancelar</button>
              <button className="btn primary" type="submit" disabled={cargando}>
                {cargando ? 'Guardando…' : usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {errorLista && <div className="alert error" role="alert">{errorLista}</div>}
      {error && !mostrarForm && <div className="alert error" role="alert">{error}</div>}

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
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {visibles.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td className="mono">{u.rol}</td>
              <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
              <td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => editarUsuario(u)}
                    disabled={!u.activo}
                    title={!u.activo ? 'Activa el usuario antes de editarlo' : undefined}
                  >
                    Editar
                  </button>
                  <button
                    className={`btn ${u.activo ? 'danger' : 'primary'}`}
                    type="button"
                    onClick={() => solicitarCambioEstado(u)}
                    disabled={u.id === usuarioActual?.id && u.activo}
                    title={u.id === usuarioActual?.id && u.activo ? 'No puedes desactivar tu propio usuario' : undefined}
                  >
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan="5" style={{ color: 'var(--ink-soft)' }}>
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

      {confirmacion && (
        <ConfirmacionModal
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          confirmarTexto={confirmacion.confirmarTexto}
          peligro={confirmacion.peligro}
          procesando={cargando}
          onConfirmar={confirmarCambioEstado}
          onCancelar={() => { if (!cargando) setConfirmacion(null); }}
        />
      )}

    </div>
  );
}
