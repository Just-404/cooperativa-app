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
  const [errorCarga, setErrorCarga] = useState('');
  const [errorSocios, setErrorSocios] = useState('');
  const [errorTipos, setErrorTipos] = useState('');
  const [cargando, setCargando] = useState(false);

  const puedeSolicitar = ['administrador', 'cajero', 'oficial_credito'].includes(user?.rol);
  const tipoSeleccionado = tipos.find((tipo) => tipo.id === form.tipoPrestamoId);

  async function cargar() {
    setErrorCarga('');
    try {
      setPrestamos(await listar());
    } catch {
      setErrorCarga('No se pudieron cargar los préstamos');
    }
  }

  useEffect(() => {
    cargar();
    listarSocios()
      .then((data) => setSocios(data.filter((socio) => socio.estado === 'activo')))
      .catch(() => setErrorSocios('No se pudieron cargar los socios disponibles'));
    listarTipos()
      .then(setTipos)
      .catch(() => setErrorTipos('No se pudieron cargar los tipos de préstamo'));
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

  function cerrarFormulario() {
    setForm(VACIO);
    setError('');
    setMostrarForm(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <h3>Préstamos</h3>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{prestamos.length} registrados</p>
        </div>
        {puedeSolicitar && (
          <button className="btn primary" onClick={() => { setError(''); setMostrarForm(true); }}>
            Nueva solicitud
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !cargando) cerrarFormulario(); }}>
          <form onSubmit={handleSubmit} className="card socio-modal" aria-labelledby="nueva-solicitud-titulo" role="dialog" aria-modal="true">
            <h3 id="nueva-solicitud-titulo">Solicitar préstamo</h3>
            <p className="socio-modal-description">Completa los datos de la solicitud.</p>
            {error && <div className="alert error" role="alert">{error}</div>}
            {errorSocios && <div className="alert error" role="alert">{errorSocios}</div>}
            {errorTipos && <div className="alert error" role="alert">{errorTipos}</div>}
            <div className="field">
              <label htmlFor="prestamo-socio">Socio</label>
              <select id="prestamo-socio" value={form.socioId} onChange={(e) => setForm({ ...form, socioId: e.target.value })} required>
                <option value="">Selecciona un socio</option>
                {socios.map((s) => <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="prestamo-tipo">Tipo de préstamo</label>
              <select id="prestamo-tipo" value={form.tipoPrestamoId} onChange={(e) => setForm({ ...form, tipoPrestamoId: e.target.value })} required>
                <option value="">Selecciona un tipo</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({t.tasaInteresAnual}% anual)</option>)}
              </select>
            </div>
            <div className="socio-form-grid">
              <div className="field">
                <label htmlFor="prestamo-monto">Monto solicitado</label>
                <input
                  id="prestamo-monto"
                  type="number"
                  min={tipoSeleccionado ? Number(tipoSeleccionado.montoMinimo) : '0.01'}
                  max={tipoSeleccionado ? Number(tipoSeleccionado.montoMaximo) : undefined}
                  step="0.01"
                  value={form.montoSolicitado}
                  onChange={(e) => setForm({ ...form, montoSolicitado: e.target.value })}
                  required
                />
                {tipoSeleccionado && (
                  <small>Entre RD$ {Number(tipoSeleccionado.montoMinimo).toLocaleString()} y RD$ {Number(tipoSeleccionado.montoMaximo).toLocaleString()}</small>
                )}
              </div>
              <div className="field">
                <label htmlFor="prestamo-plazo">Plazo (meses)</label>
                <input
                  id="prestamo-plazo"
                  type="number"
                  min="1"
                  max={tipoSeleccionado ? tipoSeleccionado.plazoMaximoMeses : undefined}
                  step="1"
                  value={form.plazoMeses}
                  onChange={(e) => setForm({ ...form, plazoMeses: e.target.value })}
                  required
                />
                {tipoSeleccionado && <small>Máximo {tipoSeleccionado.plazoMaximoMeses} meses</small>}
              </div>
            </div>
            <div className="socio-modal-actions">
              <button className="btn secondary" type="button" onClick={cerrarFormulario} disabled={cargando}>Cancelar</button>
              <button className="btn primary" type="submit" disabled={cargando}>
                {cargando ? 'Enviando…' : 'Solicitar préstamo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {errorCarga && <div className="alert error" role="alert">{errorCarga}</div>}
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
