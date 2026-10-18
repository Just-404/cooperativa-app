import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listar, crear } from '../services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

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
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{socios.length} registrados</p>
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
