import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, FilterX, UserPlus, X } from 'lucide-react';
import { listar, crear } from '../services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';
import { formatearDocumentoSocio } from '../../../utils/formatoSocio.js';

// Expresiones regulares para validación de cliente
const EXP = {
  cedulaDominicana: /^(?:[0-9]{11}|[0-9]{3}-[0-9]{7}-[0-9])$/,
  telefono: /^(?:\+\d{1,3}-)?\d{3}-\d{3}-\d{4}$|^(?:\+\d{1,3}\s)?\d{3}\s\d{3}\s\d{4}$|^\d{10}$|^\d{3}\s\d{3}\s\d{4}$/,
  // Validar edad: mínimo 18 años, máximo 90 años
  edadMinima: 18,
  edadMaxima: 90,
};

// Helper: calcular edad desde fecha de nacimiento (cliente)
function calcularEdadCliente(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

const POR_PAGINA = 10;
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '');

const VACIO = {
  nombre: '',
  apellido: '',
  documento: '',
  email: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
};

const TRAMOS = [
  { value: 'sin-scoring', label: 'Sin evaluar' },
  { value: '300-579', label: 'Bajo (300-579)', min: 300, max: 579 },
  { value: '580-669', label: 'Medio (580-669)', min: 580, max: 669 },
  { value: '670-739', label: 'Bueno (670-739)', min: 670, max: 739 },
  { value: '740+', label: 'Excelente (740+)', min: 740, max: Infinity },
];

export default function SociosPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [socios, setSocios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState('');
  const busqueda = searchParams.get('q') || '';
  const estadoSolicitado = searchParams.get('estado') || '';
  const estadoFiltro = ['activo', 'inactivo'].includes(estadoSolicitado) ? estadoSolicitado : '';
  const tramoSolicitado = searchParams.get('scoring') || '';
  const tramoFiltro = TRAMOS.some((tramo) => tramo.value === tramoSolicitado) ? tramoSolicitado : '';

  const puedeCrear = ['administrador', 'oficial_credito'].includes(user?.rol);

  function cargar() {
    setErrorLista('');
    listar()
      .then(setSocios)
      .catch(() => setErrorLista('No se pudieron cargar los socios'))
      .finally(() => setCargandoLista(false));
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);

    // Validaciones en cliente
    let valid = true;
    let mensajeError = '';

    // Validar documento (cédula dominicana)
    if (!EXP.cedulaDominicana.test(form.documento)) {
      valid = false;
      mensajeError = 'Formato de cédula dominicana inválido. Use: 00000000000 o 001-1234567-8';
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      valid = false;
      mensajeError = 'Email inválido';
    }

    // Validar teléfono
    if (!EXP.telefono.test(form.telefono)) {
      valid = false;
      mensajeError = 'Formato de teléfono inválido. Use: 000-000-0000 o +XX-000-000-0000';
    }

    // Validar edad (fecha de nacimiento)
    if (form.fechaNacimiento) {
      const edad = calcularEdadCliente(form.fechaNacimiento);
      if (edad < EXP.edadMinima) {
        valid = false;
        mensajeError = `El socio debe ser mayor de ${EXP.edadMinima} años. Edad actual: ${edad}`;
      }
      if (edad > EXP.edadMaxima) {
        valid = false;
        mensajeError = `La edad máxima permitida es de ${EXP.edadMaxima} años. Edad actual: ${edad}`;
      }
    }

    if (!valid) {
      setError(mensajeError);
      setCargando(false);
      return;
    }

    try {
      await crear(form);
      setForm(VACIO);
      setMostrarForm(false);
      setMensaje('El socio se registró correctamente.');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo registrar el socio');
    } finally {
      setCargando(false);
    }
  }

  const estados = useMemo(
    () => [...new Set(socios.map((s) => s.estado).filter(Boolean))],
    [socios]
  );

  // El texto de búsqueda se calcula una sola vez por cambio en la lista.
  // Cédula y teléfono también se indexan sin guiones/espacios para que
  // "00112345678" encuentre "001-1234567-8".
  const indexados = useMemo(
    () =>
      socios.map((s) => ({
        s,
        texto: normalizar(
          [
            s.nombre, s.apellido,
            s.documento, soloDigitos(s.documento),
            s.email,
            s.telefono, soloDigitos(s.telefono),
          ].filter(Boolean).join(' ')
        ),
      })),
    [socios]
  );

  const filtrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    const tramo = TRAMOS.find((t) => t.value === tramoFiltro);

    const coincideTramo = (p) => {
      if (!tramo) return true;                        // sin filtro: todos
      if (tramo.value === 'sin-scoring') return p == null;
      return p != null && p >= tramo.min && p <= tramo.max;
    };

    return indexados
      .filter(({ s, texto }) =>
        (!estadoFiltro || s.estado === estadoFiltro) &&
        coincideTramo(s.scoring) &&
        palabras.every((w) => texto.includes(w)))
      .map(({ s }) => s);
  }, [indexados, busqueda, estadoFiltro, tramoFiltro]);

  const {
    visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total,
    porPagina, setPorPagina, opciones,
  } = usePaginacion(filtrados, POR_PAGINA, { reiniciarCon: [busqueda, estadoFiltro, tramoFiltro] });

  const hayFiltros = busqueda.trim() !== '' || estadoFiltro !== '' || tramoFiltro !== '';

  function limpiarFiltros() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.delete('estado');
      next.delete('scoring');
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
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            {hayFiltros ? `${filtrados.length} de ${socios.length} socios` : `${socios.length} registrados`}
          </p>
        </div>
        {puedeCrear && (
          <button className="btn primary" onClick={() => { setError(''); setMensaje(''); setMostrarForm(true); }}>
            <UserPlus size={16} aria-hidden="true" /> Nuevo socio
          </button>
        )}
      </div>

      {mensaje && <div className="alert success" role="status">{mensaje}</div>}

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
                <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  Formato: 00000000000 o 001-1234567-8
                </small>
              </div>
              <div className="field">
                <label htmlFor="socio-email">Email</label>
                <input id="socio-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  Ejemplo: nombre@dominio.com
                </small>
              </div>
              <div className="field">
                <label htmlFor="socio-telefono">Teléfono</label>
                <input id="socio-telefono" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
                <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  Formato: 000-000-0000 o +XX-000-000-0000
                </small>
              </div>
              <div className="field">
                <label htmlFor="socio-fecha-nacimiento">Fecha de nacimiento</label>
                <input id="socio-fecha-nacimiento" type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} required />
                <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  Edad mínima: 18 años, máxima: 90 años
                </small>
              </div>
              <div className="field socio-address-field">
                <label htmlFor="socio-direccion">Dirección</label>
                <input id="socio-direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} required />
              </div>
            </div>
            <div className="socio-modal-actions">
              <button className="btn secondary" type="button" onClick={cerrarFormulario} disabled={cargando}>
                <X size={16} aria-hidden="true" /> Cancelar
              </button>
              <button className="btn primary" type="submit" disabled={cargando}>
                <UserPlus size={16} aria-hidden="true" /> {cargando ? 'Guardando…' : 'Registrar socio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {errorLista && <div className="alert error">{errorLista}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por nombre, cédula, email o teléfono…"
          aria-label="Buscar socios"
          value={busqueda}
          onChange={(e) => cambiarParametro('q', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') cambiarParametro('q', ''); }}
          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
        />
        <select
          aria-label="Filtrar por estado"
          value={estadoFiltro}
          onChange={(e) => cambiarParametro('estado', e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e} value={e}>{e.charAt(0).toLocaleUpperCase('es') + e.slice(1)}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por scoring crediticio"
          value={tramoFiltro}
          onChange={(e) => cambiarParametro('scoring', e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los scorings</option>
          {TRAMOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}

        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            <FilterX size={16} aria-hidden="true" /> Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead>
          <tr><th>Nombre</th><th>Documento</th><th>Email</th><th>Scoring</th><th>Estado</th><th>Detalle</th></tr>
        </thead>
        <tbody>
          {visibles.map((s) => (
            <tr key={s.id}>
              <td>{s.nombre} {s.apellido}</td>
              <td className="mono">{formatearDocumentoSocio(s.documento)}</td>
              <td>{s.email || '—'}</td>
              <td className="mono">{s.scoring ?? '—'}</td>
              <td><EstadoTag estado={s.estado} /></td>
              <td>
                <Link className="btn secondary btn-icon" to={`/socios/${s.id}${location.search}`}>
                  <Eye size={15} aria-hidden="true" /> Ver socio
                </Link>
              </td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan="6" style={{ color: 'var(--ink-soft)' }}>
                {cargandoLista
                  ? 'Cargando…'
                  : socios.length === 0
                    ? 'Aún no hay socios registrados.'
                    : 'Ningún socio coincide con la búsqueda.'}</td></tr>
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
    </div>
  );
}