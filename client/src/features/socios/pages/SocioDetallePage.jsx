import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { actualizar, cambiarEstado, obtener } from '../services/socios.service';
import { calcular, obtenerPorSocio } from '../../scoring/services/scoring.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import Paginacion from '../../../components/common/Paginacion.jsx';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import { useAuth } from '../../../context/AuthContext.jsx';

const POR_PAGINA = 10;
const FORM_VACIO = {
  nombre: '',
  apellido: '',
  documento: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
};

function formDesdeSocio(socio) {
  return Object.fromEntries(
    Object.keys(FORM_VACIO).map((campo) => [campo, socio[campo] || ''])
  );
}

function fechaLegible(fecha) {
  if (!fecha) return '—';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString();
}

export default function SocioDetallePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [socio, setSocio] = useState(null);
  const [scoring, setScoring] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [errorScoring, setErrorScoring] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formInicial, setFormInicial] = useState(FORM_VACIO);
  const [confirmacion, setConfirmacion] = useState(null);

  const puedeGestionar = ['administrador', 'oficial_credito'].includes(user?.rol);
  const puedeCalcularScoring = ['administrador', 'oficial_credito', 'cajero', 'gerente'].includes(user?.rol);
  const puntuacion = usePaginacion(scoring, POR_PAGINA, { clave: 'scoringPagina' });

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const datosSocio = await obtener(id);
      setSocio(datosSocio);
      try {
        setScoring(await obtenerPorSocio(id));
        setErrorScoring('');
      } catch {
        setErrorScoring('No se pudo cargar el historial de scoring.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo cargar la información del socio.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [id]);

  function iniciarEdicion() {
    if (socio.estado !== 'activo') {
      setError('No se puede editar un socio desactivado. Actívalo primero.');
      return;
    }
    const datos = formDesdeSocio(socio);
    setForm(datos);
    setFormInicial(datos);
    setError('');
    setEditando(true);
  }

  function cancelarEdicion() {
    if (JSON.stringify(form) !== JSON.stringify(formInicial)) {
      setConfirmacion({
        tipo: 'descartarEdicion',
        titulo: '¿Descartar los cambios?',
        mensaje: 'Los cambios que hiciste al socio no se guardarán.',
        confirmarTexto: 'Salir sin guardar',
        peligro: true,
      });
      return;
    }
    setEditando(false);
    setError('');
  }

  function solicitarEstadoSocio() {
    const estado = socio.estado === 'activo' ? 'inactivo' : 'activo';
    setConfirmacion({
      tipo: 'estadoSocio',
      estado,
      titulo: estado === 'inactivo' ? '¿Desactivar este socio?' : '¿Activar este socio?',
      mensaje: estado === 'inactivo'
        ? 'El socio dejará de estar disponible y sus cuentas activas se desactivarán.'
        : 'El socio volverá a estar activo y sus cuentas desactivadas se reactivarán.',
      confirmarTexto: estado === 'inactivo' ? 'Desactivar socio' : 'Activar socio',
      peligro: estado === 'inactivo',
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setConfirmacion({
      tipo: 'guardarSocio',
      titulo: '¿Guardar los cambios?',
      mensaje: 'Confirma que la información del socio es correcta antes de actualizarla.',
      confirmarTexto: 'Guardar cambios',
    });
  }

  function solicitarCalculoScoring() {
    setConfirmacion({
      tipo: 'calcularScoring',
      titulo: '¿Calcular el scoring?',
      mensaje: 'Se agregará una nueva evaluación al historial crediticio de este socio.',
      confirmarTexto: 'Calcular scoring',
    });
  }

  async function confirmarAccion() {
    if (!confirmacion) return;
    if (confirmacion.tipo === 'descartarEdicion') {
      setEditando(false);
      setError('');
      setConfirmacion(null);
      return;
    }

    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      if (confirmacion.tipo === 'guardarSocio') {
        await actualizar(id, form);
        setEditando(false);
        setMensaje('La información del socio se actualizó correctamente.');
      } else if (confirmacion.tipo === 'estadoSocio') {
        await cambiarEstado(id, confirmacion.estado);
        setMensaje(`El socio y sus cuentas se ${confirmacion.estado === 'activo' ? 'activaron' : 'desactivaron'} correctamente.`);
      } else if (confirmacion.tipo === 'calcularScoring') {
        await calcular(id);
        setMensaje('El scoring crediticio se calculó correctamente.');
      }
      setConfirmacion(null);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo completar la operación.');
      setConfirmacion(null);
    } finally {
      setProcesando(false);
    }
  }

  if (cargando && !socio) return <p role="status">Cargando información del socio…</p>;
  if (!socio) {
    return (
      <div>
        <Link to="/socios">← Volver a socios</Link>
        {error && <div className="alert error" role="alert">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <Link to="/socios" style={{ fontSize: '0.82rem' }}>← Volver a socios</Link>
      <div className="socio-detail-heading">
        <div>
          <h3>{socio.nombre} {socio.apellido}</h3>
          <EstadoTag estado={socio.estado} />
        </div>
        <div className="socio-detail-actions">
          {puedeGestionar && (
            <>
              <button
                className="btn secondary"
                type="button"
                onClick={iniciarEdicion}
                disabled={socio.estado !== 'activo'}
                title={socio.estado !== 'activo' ? 'Activa el socio antes de editarlo' : undefined}
              >
                Editar socio
              </button>
              <button
                className={`btn ${socio.estado === 'activo' ? 'danger' : 'primary'}`}
                type="button"
                onClick={solicitarEstadoSocio}
              >
                {socio.estado === 'activo' ? 'Desactivar socio' : 'Activar socio'}
              </button>
            </>
          )}
          <Link className="btn primary socio-button-link" to={`/socios/${id}/cuentas`}>Cuentas del socio</Link>
        </div>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {mensaje && <div className="alert success" role="status">{mensaje}</div>}

      <section className="card socio-personal-card" aria-labelledby="datos-socio-titulo">
        <h4 id="datos-socio-titulo">Información personal</h4>
        <dl className="socio-personal-grid">
          <div><dt>Nombre completo</dt><dd>{socio.nombre} {socio.apellido}</dd></div>
          <div><dt>Documento</dt><dd className="mono">{socio.documento}</dd></div>
          <div><dt>Email</dt><dd>{socio.email || '—'}</dd></div>
          <div><dt>Teléfono</dt><dd>{socio.telefono || '—'}</dd></div>
          <div><dt>Dirección</dt><dd>{socio.direccion || '—'}</dd></div>
          <div><dt>Fecha de nacimiento</dt><dd>{fechaLegible(socio.fechaNacimiento)}</dd></div>
        </dl>
      </section>

      <section className="socio-scoring-section" aria-labelledby="scoring-titulo">
        <div className="socio-section-heading">
          <h4 id="scoring-titulo">Scoring crediticio</h4>
          {puedeCalcularScoring && (
            <button className="btn secondary" type="button" onClick={solicitarCalculoScoring}>Calcular scoring</button>
          )}
        </div>
        {errorScoring && <div className="alert error" role="alert">{errorScoring}</div>}
        <table className="ledger">
          <thead><tr><th>Fecha</th><th>Puntaje</th></tr></thead>
          <tbody>
            {puntuacion.visibles.map((s) => (
              <tr key={s.id}>
                <td>{fechaLegible(s.fechaEvaluacion?.slice(0, 10))}</td>
                <td className="mono">{s.puntaje}</td>
              </tr>
            ))}
            {scoring.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--ink-soft)' }}>Sin evaluaciones aún.</td></tr>}
          </tbody>
        </table>
        <Paginacion
          paginaActual={puntuacion.paginaActual}
          totalPaginas={puntuacion.totalPaginas}
          onCambiar={puntuacion.setPagina}
          desde={puntuacion.desde}
          hasta={puntuacion.hasta}
          total={puntuacion.total}
        />
      </section>

      {editando && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !procesando) cancelarEdicion(); }}>
          <form onSubmit={handleSubmit} className="card socio-modal" aria-labelledby="editar-socio-titulo" role="dialog" aria-modal="true">
            <h3 id="editar-socio-titulo">Editar socio</h3>
            <p className="socio-modal-description">Actualiza los datos personales del socio.</p>
            {error && <div className="alert error" role="alert">{error}</div>}
            <div className="socio-form-grid">
              <div className="field">
                <label htmlFor="editar-socio-nombre">Nombre</label>
                <input id="editar-socio-nombre" autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="editar-socio-apellido">Apellido</label>
                <input id="editar-socio-apellido" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="editar-socio-documento">Documento</label>
                <input id="editar-socio-documento" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="editar-socio-email">Email</label>
                <input id="editar-socio-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="editar-socio-telefono">Teléfono</label>
                <input id="editar-socio-telefono" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="editar-socio-fecha">Fecha de nacimiento</label>
                <input id="editar-socio-fecha" type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} required />
              </div>
              <div className="field socio-address-field">
                <label htmlFor="editar-socio-direccion">Dirección</label>
                <input id="editar-socio-direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} required />
              </div>
            </div>
            <div className="socio-modal-actions">
              <button className="btn secondary" type="button" onClick={cancelarEdicion} disabled={procesando}>Cancelar</button>
              <button className="btn primary" type="submit" disabled={procesando}>Guardar cambios</button>
            </div>
          </form>
        </div>
      )}

      {confirmacion && (
        <ConfirmacionModal
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          confirmarTexto={confirmacion.confirmarTexto}
          peligro={confirmacion.peligro}
          procesando={procesando}
          onConfirmar={confirmarAccion}
          onCancelar={() => { if (!procesando) setConfirmacion(null); }}
        />
      )}
    </div>
  );
}
