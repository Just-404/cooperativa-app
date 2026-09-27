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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <h3>Usuarios del sistema</h3>
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
