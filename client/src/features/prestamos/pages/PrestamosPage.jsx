import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listar, solicitar, listarTipos } from '../services/prestamos.service';
import { listar as listarSocios } from '../../socios/services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import SocioSelect from './SociosSelect.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';

const POR_PAGINA = 10;
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '');

const VACIO = { socioId: '', tipoPrestamoId: '', montoSolicitado: '', plazoMeses: '' };

export default function PrestamosPage() {
  const { user } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [errorSocios, setErrorSocios] = useState('');
  const [errorTipos, setErrorTipos] = useState('');
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const [errorLista, setErrorLista] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const puedeSolicitar = ['administrador', 'cajero', 'oficial_credito'].includes(user?.rol);
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
    if (!form.socioId) {
      setError('Selecciona un socio');
      return;
    }
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

  const estados = useMemo(
    () => [...new Set(prestamos.map((p) => p.estado).filter(Boolean))],
    [prestamos]
  );

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

  const { visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total } =
    usePaginacion(filtrados, POR_PAGINA, { reiniciarCon: [busqueda, estadoFiltro] });
  const hayFiltros = busqueda.trim() !== '' || estadoFiltro !== '';

  function limpiarFiltros() {
    setBusqueda('');
    setEstadoFiltro('');
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
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            {hayFiltros ? `${filtrados.length} de ${prestamos.length} préstamos` : `${prestamos.length} registrados`}
          </p>
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
              <button className="btn secondary" type="button" onClick={cerrarFormulario} disabled={cargando}>Cancelar</button>
              <button className="btn primary" type="submit" disabled={cargando}>
                {cargando ? 'Enviando…' : 'Solicitar préstamo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {errorLista && <div className="alert error" role="alert">{errorLista}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por socio, tipo o monto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
        />
        <select
          value={estadoFiltro}
          onChange={(e) => { setEstadoFiltro(e.target.value); }}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead><tr><th>Socio</th><th>Tipo</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {visibles.map((p) => (
            <tr key={p.id}>
              <td>{p.socio?.nombre} {p.socio?.apellido}</td>
              <td>{p.tipoPrestamo?.nombre}</td>
              <td className="mono">RD$ {Number(p.montoSolicitado).toLocaleString()}</td>
              <td><EstadoTag estado={p.estado} /></td>
              <td><Link to={`/prestamos/${p.id}`}>Ver</Link></td>
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
      />
    </div>
  );
}
