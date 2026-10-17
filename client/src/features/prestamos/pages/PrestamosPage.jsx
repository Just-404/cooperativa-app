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
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const [errorLista, setErrorLista] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const puedeSolicitar = ['administrador', 'cajero', 'oficial_credito'].includes(user?.rol);

  function cargar() {
    setErrorLista('');
    listar()
      .then(setPrestamos)
      .catch(() => setErrorLista('No se pudieron cargar los préstamos'))
      .finally(() => setCargandoLista(false));
  }
  useEffect(() => {
    cargar();
    listarSocios().then(setSocios).catch(() => { });
    listarTipos().then(setTipos).catch(() => { });
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
            <SocioSelect
              socios={socios}
              value={form.socioId}
              onChange={(id) => setForm({ ...form, socioId: id })}
            />
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
