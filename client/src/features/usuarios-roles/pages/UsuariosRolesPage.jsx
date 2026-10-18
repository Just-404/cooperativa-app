import { useEffect, useState } from 'react';
import { listar, crear } from '../services/usuarios-roles.service';

const VACIO = { nombre: '', email: '', password: '', rol: 'cajero' };
const ROLES = ['administrador', 'cajero', 'oficial_credito', 'gerente', 'auditor'];

export default function UsuariosRolesPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function cargar() {
    listar().then(setUsuarios).catch(() => setError('No se pudieron cargar los usuarios'));
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

  function cerrarFormulario() {
    setForm(VACIO);
    setError('');
    setMostrarForm(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <h3>Usuarios del sistema</h3>
        <button className="btn primary" onClick={() => { setError(''); setMostrarForm(true); }}>
          Nuevo usuario
        </button>
      </div>

      {mostrarForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !cargando) cerrarFormulario(); }}>
          <form onSubmit={handleSubmit} className="card socio-modal" aria-labelledby="nuevo-usuario-titulo" role="dialog" aria-modal="true">
            <h3 id="nuevo-usuario-titulo">Crear usuario</h3>
            <p className="socio-modal-description">Completa los datos de acceso del usuario.</p>
            {error && <div className="alert error" role="alert">{error}</div>}
            <div className="field">
              <label htmlFor="usuario-nombre">Nombre</label>
              <input id="usuario-nombre" autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="usuario-email">Email</label>
              <input id="usuario-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="usuario-password">Contraseña temporal</label>
              <input id="usuario-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
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
                {cargando ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="ledger">
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr></thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td className="mono">{u.rol}</td>
              <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
