import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calculator, Eye, Pencil, Save, UserCheck, UserX, Wallet, X } from 'lucide-react';
import { actualizar, cambiarEstado, obtener } from '../services/socios.service';
import { calcular, obtenerPorSocio } from '../../scoring/services/scoring.service';
import { listarEnMora } from '../../cuotas-pagos/services/cuotas-pagos.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import Paginacion from '../../../components/common/Paginacion.jsx';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import { useAuth } from '../../../context/AuthContext.jsx';
import { formatearDocumentoSocio, formatearTelefonoSocio } from '../../../utils/formatoSocio.js';

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

// Helper: formatear monto con separador de miles
function formatoMonto(monto) {
  return new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto);
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
  const [moraInfo, setMoraInfo] = useState([]); // Cuotas vencidas de este socio

  const puedeGestionar = ['administrador', 'oficial_credito'].includes(user?.rol);
  const puedeCalcularScoring = ['administrador', 'oficial_credito', 'cajero', 'gerente'].includes(user?.rol);
  const puntuacion = usePaginacion(scoring, POR_PAGINA, { clave: 'scoringPagina' });

  async function cargar() {
    setCargando(true);
    setError('');
    setMoraInfo([]);
    try {
      const datosSocio = await obtener(id);
      setSocio(datosSocio);
      try {
        setScoring(await obtenerPorSocio(id));
        setErrorScoring('');
      } catch {
        setErrorScoring('No se pudo cargar el historial de scoring.');
      }
      // El endpoint devuelve todas las cuotas vencidas con su préstamo y socio.
      try {
        const cuotasEnMora = await listarEnMora();
        setMoraInfo(cuotasEnMora.filter((cuota) => (
          cuota.prestamo?.socio?.id === datosSocio.id
          || cuota.prestamo?.socio?.documento === datosSocio.documento
        )));
      } catch {
        // La mora es información complementaria: no bloquea la ficha del socio.
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
        <Link className="link-accion" to="/socios"><ArrowLeft size={15} aria-hidden="true" /> Volver a socios</Link>
        {error && <div className="alert error" role="alert">{error}</div>}
      </div>
    );
  }

  // Total de mora de las cuotas vencidas de este socio.
  const totalMoraSocio = moraInfo.reduce(
    (acc, cuota) => acc + Number(cuota.montoMora || 0),
    0
  );

  return (
    <div>
      <Link className="link-accion" to="/socios" style={{ fontSize: '0.82rem' }}>
        <ArrowLeft size={15} aria-hidden="true" /> Volver a socios
      </Link>
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
                <Pencil size={16} aria-hidden="true" /> Editar socio
              </button>
              <button
                className={`btn ${socio.estado === 'activo' ? 'danger' : 'primary'}`}
                type="button"
                onClick={solicitarEstadoSocio}
              >
                {socio.estado === 'activo'
                  ? <UserX size={16} aria-hidden="true" />
                  : <UserCheck size={16} aria-hidden="true" />}
                {socio.estado === 'activo' ? 'Desactivar socio' : 'Activar socio'}
              </button>
            </>
          )}
          <Link className="btn primary socio-button-link" to={`/socios/${id}/cuentas`}>
            <Wallet size={16} aria-hidden="true" /> Cuentas del socio
          </Link>
        </div>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {mensaje && <div className="alert success" role="status">{mensaje}</div>}

      <section className="card socio-personal-card" aria-labelledby="datos-socio-titulo">
        <h4 id="datos-socio-titulo">Información personal</h4>
        <dl className="socio-personal-grid">
          <div><dt>Nombre completo</dt><dd>{socio.nombre} {socio.apellido}</dd></div>
          <div><dt>Documento</dt><dd className="mono">{formatearDocumentoSocio(socio.documento)}</dd></div>
          <div><dt>Email</dt><dd>{socio.email || '—'}</dd></div>
          <div><dt>Teléfono</dt><dd>{socio.telefono ? formatearTelefonoSocio(socio.telefono) : '—'}</dd></div>
          <div><dt>Dirección</dt><dd>{socio.direccion || '—'}</dd></div>
          <div><dt>Fecha de nacimiento</dt><dd>{fechaLegible(socio.fechaNacimiento)}</dd></div>
        </dl>
        
        <section className="socio-mora-section" aria-labelledby="mora-titulo">
          <div className="socio-section-heading">
            <h4 id="mora-titulo">Cuotas con mora</h4>
            {moraInfo.length > 0 && (
              <p>
                {moraInfo.length} cuota(s) vencida(s) · Total: <strong>{formatoMonto(totalMoraSocio)}</strong>
              </p>
            )}
          </div>
          {moraInfo.length > 0 ? (
            <div className="config-table-wrap">
              <table className="ledger config-table">
                <thead>
                  <tr>
                    <th>Cuota</th>
                    <th>Vencimiento</th>
                    <th>Monto</th>
                    <th>Mora</th>
                    <th>Tasa aplicada</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {moraInfo.map((cuota) => (
                    <tr key={cuota.id}>
                      <td>{cuota.numeroCuota}</td>
                      <td className="mono">{fechaLegible(cuota.fechaVencimiento?.slice(0, 10))}</td>
                      <td className="mono">{formatoMonto(cuota.montoTotal)}</td>
                      <td className="mono">{formatoMonto(cuota.montoMora)}</td>
                      <td className="mono">
                        {cuota.tasaMoraAplicada != null
                          ? `${(Number(cuota.tasaMoraAplicada) * 100).toFixed(3)}% diario`
                          : '—'}
                      </td>
                      <td>
                        <Link
                          className="btn secondary btn-icon"
                          to={`/prestamos/${cuota.prestamo?.id}`}
                        >
                          <Eye size={15} aria-hidden="true" /> Ver préstamo
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Sin cuotas en mora.</p>
          )}
        </section>

        <section className="socio-scoring-section" aria-labelledby="scoring-titulo">
          <div className="socio-section-heading">
            <h4 id="scoring-titulo">Scoring crediticio</h4>
            {puedeCalcularScoring && (
              <button className="btn secondary" type="button" onClick={solicitarCalculoScoring}>
                <Calculator size={16} aria-hidden="true" /> Calcular scoring
              </button>
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
              <button className="btn secondary" type="button" onClick={cancelarEdicion} disabled={procesando}>
                <X size={16} aria-hidden="true" /> Cancelar
              </button>
              <button className="btn primary" type="submit" disabled={procesando}>
                <Save size={16} aria-hidden="true" /> Guardar cambios
              </button>
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