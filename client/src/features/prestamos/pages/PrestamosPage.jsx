import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listar, solicitar, listarTipos } from '../services/prestamos.service';
import { listar as listarSocios } from '../../socios/services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const VACIO = { socioId: '', tipoPrestamoId: '', montoSolicitado: '', plazoMeses: '' };

export default function PrestamosPage() {
  const { user } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const puedeSolicitar = ['administrador', 'cajero', 'oficial_credito'].includes(user?.rol);

  function cargar() {
    listar().then(setPrestamos).catch(() => setError('No se pudieron cargar los préstamos'));
  }

  useEffect(() => {
    cargar();
    listarSocios().then(setSocios).catch(() => {});
    listarTipos().then(setTipos).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await solicitar({
        ...form,
        montoSolicitado: Number(form.montoSolicitado),
        plazoMeses: Number(form.plazoMeses),
      });
      setForm(VACIO);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo registrar la solicitud');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <h3>Préstamos</h3>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{prestamos.length} registrados</p>
        </div>
        {puedeSolicitar && (
          <button className="btn primary" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? 'Cancelar' : 'Nueva solicitud'}
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 22, maxWidth: 480 }}>
          {error && <div className="alert error">{error}</div>}
          <div className="field">
            <label>Socio</label>
            <select value={form.socioId} onChange={(e) => setForm({ ...form, socioId: e.target.value })} required>
              <option value="">Selecciona un socio</option>
              {socios.map((s) => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tipo de préstamo</label>
            <select value={form.tipoPrestamoId} onChange={(e) => setForm({ ...form, tipoPrestamoId: e.target.value })} required>
              <option value="">Selecciona un tipo</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.tasaInteresAnual}% anual)</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Monto solicitado</label>
              <input type="number" min="0" value={form.montoSolicitado} onChange={(e) => setForm({ ...form, montoSolicitado: e.target.value })} required />
            </div>
            <div className="field">
              <label>Plazo (meses)</label>
              <input type="number" min="1" value={form.plazoMeses} onChange={(e) => setForm({ ...form, plazoMeses: e.target.value })} required />
            </div>
          </div>
          <button className="btn primary" type="submit" disabled={cargando}>
            {cargando ? 'Enviando…' : 'Solicitar préstamo'}
          </button>
        </form>
      )}

      <table className="ledger">
        <thead><tr><th>Socio</th><th>Tipo</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {prestamos.map((p) => (
            <tr key={p.id}>
              <td>{p.socio?.nombre} {p.socio?.apellido}</td>
              <td>{p.tipoPrestamo?.nombre}</td>
              <td className="mono">RD$ {Number(p.montoSolicitado).toLocaleString()}</td>
              <td><EstadoTag estado={p.estado} /></td>
              <td><Link to={`/prestamos/${p.id}`}>Ver</Link></td>
            </tr>
          ))}
          {prestamos.length === 0 && (
            <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>Aún no hay préstamos registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
