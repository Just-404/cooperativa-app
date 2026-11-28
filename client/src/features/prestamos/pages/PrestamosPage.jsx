import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, FilePlus, FilterX, Send, X } from 'lucide-react';
import { listar, solicitar, listarTipos } from '../services/prestamos.service';
import { listar as listarSocios } from '../../socios/services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import SocioSelect from './SociosSelect.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';

const POR_PAGINA = 10;
const ESTADOS_PRESTAMO = [
  { value: 'solicitado', label: 'Solicitado' },
  { value: 'evaluado', label: 'Evaluación' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'desembolsado', label: 'Desembolso' },
  { value: 'rechazado', label: 'Rechazado' },
];
const ROL_POR_ESTADO = {
  solicitado: 'oficial_credito',
  evaluado: 'gerente',
  aprobado: 'cajero',
  desembolsado: 'cajero',
};
const ESTILO_FILTRO_ACCIONABLE = {
  color: 'var(--white)',
  backgroundColor: 'var(--forest)',
  fontWeight: 700,
};
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '');

const VACIO = { socioId: '', tipoPrestamoId: '', montoSolicitado: '', plazoMeses: '' };

function esEstadoAccionable(estado, rol) {
  return rol !== 'administrador' && ROL_POR_ESTADO[estado] === rol;
}

export default function PrestamosPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prestamos, setPrestamos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errorSocios, setErrorSocios] = useState('');
  const [errorTipos, setErrorTipos] = useState('');
  const [cargando, setCargando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const busqueda = searchParams.get('q') || '';
  const estadoSolicitado = searchParams.get('estado') || '';
  const estadoFiltro = ESTADOS_PRESTAMO.some((estado) => estado.value === estadoSolicitado)
    ? estadoSolicitado
    : '';

  const [errorLista, setErrorLista] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const puedeSolicitar = ['administrador', 'cajero'].includes(user?.rol);
  const tipoSeleccionado = tipos.find((tipo) => tipo.id === form.tipoPrestamoId);

  async function cargar() {
    setErrorLista('');
    try {
      setPrestamos(await listar());
    } catch {
      setErrorLista('No se pudieron cargar los préstamos');
    } finally {
      setCargandoLista(false);
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
    setMensaje('');
    if (!form.socioId) {
      setError('Selecciona un socio');
      return;
    }
    setError('');
    setConfirmacion({
      tipo: 'crearSolicitud',
      titulo: '¿Crear esta solicitud de préstamo?',
      mensaje: 'Confirma que los datos del socio, monto y plazo son correctos antes de registrarla.',
      confirmarTexto: 'Crear solicitud',
    });
  }

  async function confirmarSolicitud() {
    if (!confirmacion || cargando) return;
    setCargando(true);
    try {
      await solicitar({
        ...form,
        montoSolicitado: Number(form.montoSolicitado),
        plazoMeses: Number(form.plazoMeses),
      });
      setForm(VACIO);
      setMostrarForm(false);
      setConfirmacion(null);
      setMensaje('La solicitud de préstamo se registró correctamente.');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo registrar la solicitud');
      setConfirmacion(null);
    } finally {
      setCargando(false);
    }
  }

  function confirmarAccion() {
    if (!confirmacion) return;
    if (confirmacion.tipo === 'descartarSolicitud') {
      cerrarFormulario();
      setConfirmacion(null);
      return;
    }
    confirmarSolicitud();
  }

  const indexados = useMemo(
    () =>
      prestamos.map((p) => ({
        p,
        texto: normalizar(
          [
            p.socio?.nombre, p.socio?.apellido, soloDigitos(p.socio?.documento),
            p.tipoPrestamo?.nombre,
            p.montoSolicitado, Number(p.montoSolicitado).toLocaleString(),
          ].filter(Boolean).join(' ')
        ),
      })),
    [prestamos]
  );

  const filtrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return indexados
      .filter(({ p, texto }) =>
        (!estadoFiltro || p.estado === estadoFiltro) &&
        palabras.every((w) => texto.includes(w)))
      .map(({ p }) => p);
  }, [indexados, busqueda, estadoFiltro]);

  const {
    visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total,
    porPagina, setPorPagina, opciones,
  } = usePaginacion(filtrados, POR_PAGINA, { reiniciarCon: [busqueda, estadoFiltro] });

  const hayFiltros = busqueda.trim() !== '' || estadoFiltro !== '';

  function limpiarFiltros() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.delete('estado');
      return next;
    }, { replace: true });
  }

  function cambiarParametro(clave, valor) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (valor) next.set(clave, valor);
      else next.delete(clave);
      return next;
    }, { replace: true });
  }

  function cambiarEstadoFiltro(estado) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (estado) next.set('estado', estado);
      else next.delete('estado');
      return next;
    }, { replace: true });
  }

  function cerrarFormulario() {
    setForm(VACIO);
    setError('');
    setMostrarForm(false);
  }

  function cancelarFormulario() {
    if (Object.values(form).some((valor) => String(valor).trim() !== '')) {
      setConfirmacion({
        tipo: 'descartarSolicitud',
        titulo: '¿Descartar la solicitud?',
        mensaje: 'Los datos ingresados no se guardarán.',
        confirmarTexto: 'Salir sin guardar',
        cancelarTexto: 'Continuar editando',
        peligro: true,
      });
      return;
    }
    cerrarFormulario();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <h3>Préstamos</h3>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            {hayFiltros ? `${filtrados.length} de ${prestamos.length} préstamos` : `${prestamos.length} registrados`}
          </p>
        </div>
        {puedeSolicitar && (
          <button className="btn primary" onClick={() => { setError(''); setMensaje(''); setMostrarForm(true); }}>
            <FilePlus size={16} aria-hidden="true" /> Nueva solicitud
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !cargando) cancelarFormulario(); }}>
          <form onSubmit={handleSubmit} className="card socio-modal" aria-labelledby="nueva-solicitud-titulo" role="dialog" aria-modal="true">
            <h3 id="nueva-solicitud-titulo">Solicitar préstamo</h3>
            <p className="socio-modal-description">Completa los datos de la solicitud.</p>
            {error && <div className="alert error" role="alert">{error}</div>}
            {errorSocios && <div className="alert error" role="alert">{errorSocios}</div>}
            {errorTipos && <div className="alert error" role="alert">{errorTipos}</div>}
            <div className="field">
              <label>Socio</label>
              <SocioSelect
                socios={socios}
                value={form.socioId}
                onChange={(id) => setForm({ ...form, socioId: id })}
              />
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
              <button className="btn secondary" type="button" onClick={cancelarFormulario} disabled={cargando}>
                <X size={16} aria-hidden="true" /> Cancelar
              </button>
              <button className="btn primary" type="submit" disabled={cargando}>
                <Send size={16} aria-hidden="true" /> {cargando ? 'Enviando…' : 'Solicitar préstamo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {errorLista && <div className="alert error" role="alert">{errorLista}</div>}
      {mensaje && <div className="alert success" role="status">{mensaje}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por socio, tipo o monto…"
          value={busqueda}
          onChange={(e) => cambiarParametro('q', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') cambiarParametro('q', ''); }}
          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
        />
        <select
          value={estadoFiltro}
          onChange={(e) => cambiarEstadoFiltro(e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_PRESTAMO.map(({ value, label }) => (
            <option
              key={value}
              value={value}
              style={esEstadoAccionable(value, user?.rol) ? ESTILO_FILTRO_ACCIONABLE : undefined}
            >
              {label}
            </option>
          ))}
        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            <FilterX size={16} aria-hidden="true" /> Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead><tr><th>Socio</th><th>Tipo</th><th>Monto</th><th>Estado</th><th>Detalle</th></tr></thead>
        <tbody>
          {visibles.map((p) => (
            <tr key={p.id}>
              <td>{p.socio?.nombre} {p.socio?.apellido}</td>
              <td>{p.tipoPrestamo?.nombre}</td>
              <td className="mono">RD$ {Number(p.montoSolicitado).toLocaleString()}</td>
              <td>
                <EstadoTag
                  estado={p.estado}
                  resaltado={esEstadoAccionable(p.estado, user?.rol)}
                />
              </td>
              <td>
                <Link className="btn secondary btn-icon" to={`/prestamos/${p.id}${location.search}`}>
                  <Eye size={15} aria-hidden="true" /> Ver préstamo
                </Link>
              </td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>
              {cargandoLista
                ? 'Cargando…'
                : prestamos.length === 0
                  ? 'Aún no hay préstamos registrados.'
                  : 'Ningún préstamo coincide con la búsqueda.'}
            </td></tr>
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
        porPagina={porPagina}
        opcionesPorPagina={opciones}
        onCambiarPorPagina={setPorPagina}
      />
      {confirmacion && (
        <ConfirmacionModal
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          confirmarTexto={confirmacion.confirmarTexto}
          cancelarTexto={confirmacion.cancelarTexto}
          peligro={confirmacion.peligro}
          procesando={cargando}
          onConfirmar={confirmarAccion}
          onCancelar={() => { if (!cargando) setConfirmacion(null); }}
        />
      )}
    </div>
  );
}
