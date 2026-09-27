import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listar, crear } from '../services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const VACIO = { nombre: '', apellido: '', documento: '', email: '', telefono: '' };

export default function SociosPage() {
  const { user } = useAuth();
  const [socios, setSocios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const puedeCrear = ['administrador', 'oficial_credito'].includes(user?.rol);

  function cargar() {
    listar().then(setSocios).catch(() => setError('No se pudieron cargar los socios'));
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <h3>Socios</h3>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{socios.length} registrados</p>
        </div>
        {puedeCrear && (
          <button className="btn primary" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? 'Cancelar' : 'Nuevo socio'}
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 22, maxWidth: 480 }}>
          {error && <div className="alert error">{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="field">
              <label>Apellido</label>
              <input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
            </div>
          </div>
          <div className="field">
            <label>Documento (cédula)</label>
            <input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required />
          </div>
          <div className="field">
            <label>Email (opcional)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Teléfono (opcional)</label>
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <button className="btn primary" type="submit" disabled={cargando}>
            {cargando ? 'Guardando…' : 'Registrar socio'}
          </button>
        </form>
      )}

      <table className="ledger">
        <thead>
          <tr><th>Nombre</th><th>Documento</th><th>Email</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          {socios.map((s) => (
            <tr key={s.id}>
              <td>{s.nombre} {s.apellido}</td>
              <td className="mono">{s.documento}</td>
              <td>{s.email || '—'}</td>
              <td><EstadoTag estado={s.estado} /></td>
              <td><Link to={`/socios/${s.id}`}>Ver</Link></td>
            </tr>
          ))}
          {socios.length === 0 && (
            <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>Aún no hay socios registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
