import { useEffect, useState, useMemo } from 'react';
import { Eye, FilterX, X } from 'lucide-react';
import { listar } from '../services/auditoria.service';
import usePaginacion from '../../../hooks/usePaginacion';
import Paginacion from '../../../components/common/Paginacion.jsx';

const POR_PAGINA = 10;
const normalizar = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function parsearDetalle(detalle) {
  if (!detalle) return {};
  if (typeof detalle === 'object') return detalle;
  try {
    return JSON.parse(detalle);
  } catch {
    return { datos: detalle };
  }
}

function prepararDetalle(evento) {
  const detalle = parsearDetalle(evento?.detalle);
  if (!['deposito', 'retiro'].includes(evento?.accion)) return detalle;

  const cambioCuenta = detalle.cambiosRelacionados?.find((cambio) => cambio.entidad === 'cuenta');
  if (!cambioCuenta) return detalle;

  return {
    ...detalle,
    operacion: 'actualizar',
    antes: cambioCuenta.antes,
    despues: cambioCuenta.despues,
    movimiento: detalle.movimiento || detalle.despues,
    cambiosRelacionados: detalle.cambiosRelacionados.filter((cambio) => cambio !== cambioCuenta),
  };
}

function nombreAfectado(evento, detalle = parsearDetalle(evento?.detalle)) {
  if (typeof detalle.afectado === 'string') return detalle.afectado;
  if (detalle.afectado?.nombre) return detalle.afectado.nombre;
  if (!['socio', 'usuario'].includes(evento?.entidad)) return '';
  const registro = detalle.despues || detalle.antes;
  if (!registro || Array.isArray(registro)) return '';
  return [registro.nombre, registro.apellido].filter(Boolean).join(' ');
}

function tituloRegistro(operacion) {
  if (operacion === 'insertar') return 'Registro insertado';
  if (operacion === 'actualizar') return 'Registro actualizado';
  if (operacion === 'eliminar') return 'Registro eliminado';
  return 'Después del cambio';
}

function formatearCampo(campo) {
  return String(campo)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (letra) => letra.toLocaleUpperCase('es'));
}

function ValorDetalle({ valor }) {
  if (valor === null || valor === undefined || valor === '') return <span>Sin valor</span>;
  if (typeof valor === 'boolean') return <span>{valor ? 'Sí' : 'No'}</span>;
  if (typeof valor === 'object') {
    return (
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {JSON.stringify(valor, null, 2)}
      </pre>
    );
  }
  return <span style={{ overflowWrap: 'anywhere' }}>{String(valor)}</span>;
}

function Snapshot({ valor }) {
  if (valor === null || valor === undefined) return <p>No hay información disponible.</p>;
  const registros = Array.isArray(valor) ? valor : [valor];
  if (registros.length === 0) return <p>No hay registros.</p>;

  return registros.map((registro, indice) => (
    <dl
      key={registro?.id || indice}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px 18px',
        margin: '12px 0 0',
      }}
    >
      {Object.entries(registro || {}).map(([campo, contenido]) => (
        <div key={campo} style={{ minWidth: 0 }}>
          <dt style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', fontWeight: 600 }}>
            {formatearCampo(campo)}
          </dt>
          <dd style={{ margin: '3px 0 0' }}><ValorDetalle valor={contenido} /></dd>
        </div>
      ))}
    </dl>
  ));
}

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  useEffect(() => {
    listar()
      .then(setEventos)
      .catch(() => setError('No se pudo cargar la auditoría'))
      .finally(() => setCargandoLista(false));
  }, []);

  const ordenados = useMemo(
    () => [...eventos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
    [eventos]
  );

  const roles = useMemo(
    () => [...new Set(eventos.map((e) => e.usuario?.rol).filter(Boolean))].sort(),
    [eventos]
  );

  const indexados = useMemo(
    () =>
      ordenados.map((e) => ({
        e,
        texto: normalizar(
          [
            new Date(e.fecha).toLocaleString(),
            e.usuario?.nombre,
            e.usuario?.rol,
            e.accion,
            nombreAfectado(e),
          ]
            .filter(Boolean)
            .join(' ')
        ),
      })),
    [ordenados]
  );

  const filtrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return indexados
      .filter(({ e, texto }) =>
        (!rolFiltro || e.usuario?.rol === rolFiltro) &&
        palabras.every((w) => texto.includes(w)))
      .map(({ e }) => e);
  }, [indexados, busqueda, rolFiltro]);

  const {
    visibles, paginaActual, totalPaginas, setPagina, desde, hasta, total,
    porPagina, setPorPagina, opciones,
  } = usePaginacion(filtrados, POR_PAGINA, { reiniciarCon: [busqueda, rolFiltro] });


  const hayFiltros = busqueda.trim() !== '' || rolFiltro !== '';
  const detalleSeleccionado = eventoSeleccionado
    ? prepararDetalle(eventoSeleccionado)
    : null;
  const tieneSnapshots = detalleSeleccionado
    && ('antes' in detalleSeleccionado || 'despues' in detalleSeleccionado);
  const afectado = eventoSeleccionado
    ? nombreAfectado(eventoSeleccionado, detalleSeleccionado)
    : '';

  function limpiarFiltros() {
    setBusqueda('');
    setRolFiltro('');
  }

  return (
    <div>
      <h3>Auditoría</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
        {hayFiltros
          ? `${filtrados.length} de ${eventos.length} acciones`
          : 'Últimas 200 acciones registradas en el sistema.'}
      </p>
      {error && <div className="alert error">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por usuario, acción o fecha…"
          aria-label="Buscar en la auditoría"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') setBusqueda(''); }}
          style={{ flex: '1 1 220px', width: 'auto', minWidth: 0 }}
        />
        <select
          aria-label="Filtrar por rol"
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value)}
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {hayFiltros && (
          <button type="button" className="btn ghost" onClick={limpiarFiltros}>
            <FilterX size={16} aria-hidden="true" /> Limpiar
          </button>
        )}
      </div>

      <table className="ledger">
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
        <tbody>
          {visibles.map((e) => (
            <tr key={e.id}>
              <td className="mono">{new Date(e.fecha).toLocaleString()}</td>
              <td>{e.usuario?.nombre || '—'}</td>
              <td>
                {e.accion}
                {nombreAfectado(e) && (
                  <small style={{ display: 'block', color: 'var(--ink-soft)' }}>
                    Afectado: {nombreAfectado(e)}
                  </small>
                )}
              </td>
              <td>
                <button className="btn secondary" type="button" onClick={() => setEventoSeleccionado(e)}>
                  <Eye size={15} aria-hidden="true" /> Ver
                </button>
              </td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr>
              <td colSpan="4" style={{ color: 'var(--ink-soft)' }}>
                {cargandoLista
                  ? 'Cargando…'
                  : eventos.length === 0
                    ? 'Sin eventos registrados aún.'
                    : 'Ningún evento coincide con la búsqueda.'}
              </td>
            </tr>
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

      {eventoSeleccionado && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setEventoSeleccionado(null); }}
        >
          <section
            className="card socio-modal"
            style={{ width: 'min(100%, 920px)', maxHeight: '90vh' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auditoria-detalle-titulo"
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 id="auditoria-detalle-titulo">Detalle de auditoría</h3>
              <button
                className="btn secondary"
                type="button"
                onClick={() => setEventoSeleccionado(null)}
              >
                <X size={16} aria-hidden="true" /> Cerrar
              </button>
            </header>
            <p className="socio-modal-description">
              Información de la acción registrada en el sistema.
            </p>

            <dl className="socio-personal-grid" style={{ marginTop: 0, marginBottom: 20 }}>
              <div><dt>Fecha</dt><dd>{new Date(eventoSeleccionado.fecha).toLocaleString()}</dd></div>
              <div>
                <dt>Usuario</dt>
                <dd>{eventoSeleccionado.usuario?.nombre || eventoSeleccionado.usuarioId || '—'}</dd>
              </div>
              <div><dt>Rol del usuario</dt><dd>{eventoSeleccionado.usuario?.rol || '—'}</dd></div>
              <div><dt>Acción</dt><dd>{eventoSeleccionado.accion}</dd></div>
              {afectado && <div><dt>Afectado</dt><dd>{afectado}</dd></div>}
              <div><dt>Entidad</dt><dd>{eventoSeleccionado.entidad || '—'}</dd></div>
              <div><dt>ID de entidad</dt><dd className="mono">{eventoSeleccionado.entidadId || '—'}</dd></div>
            </dl>

            {tieneSnapshots ? (
              <>
                {detalleSeleccionado.operacion === 'insertar' ? (
                  <section className="card">
                    <h4 style={{ marginTop: 0 }}>Registro insertado</h4>
                    {detalleSeleccionado.despues == null
                      ? <p>No se capturó el registro insertado.</p>
                      : <Snapshot valor={detalleSeleccionado.despues} />}
                  </section>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                    <section className="card">
                      <h4 style={{ marginTop: 0 }}>Antes del cambio</h4>
                      {detalleSeleccionado.antes == null
                        ? <p>No se pudo capturar el estado anterior.</p>
                        : <Snapshot valor={detalleSeleccionado.antes} />}
                    </section>
                    <section className="card">
                      <h4 style={{ marginTop: 0 }}>{tituloRegistro(detalleSeleccionado.operacion)}</h4>
                      {detalleSeleccionado.despues == null
                        ? <p>{detalleSeleccionado.operacion === 'eliminar' ? 'El registro fue eliminado.' : 'No se capturó un estado posterior.'}</p>
                        : <Snapshot valor={detalleSeleccionado.despues} />}
                    </section>
                  </div>
                )}
                {detalleSeleccionado.cambiosRelacionados?.map((cambio) => (
                  <section key={cambio.entidad} style={{ marginTop: 16 }}>
                    <h4>{`Cambio en ${cambio.entidad}`}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                      <section className="card">
                        <h4 style={{ marginTop: 0 }}>Antes del cambio</h4>
                        {cambio.antes == null
                          ? <p>No se pudo capturar el estado anterior.</p>
                          : <Snapshot valor={cambio.antes} />}
                      </section>
                      <section className="card">
                        <h4 style={{ marginTop: 0 }}>Después del cambio</h4>
                        {cambio.despues == null
                          ? <p>No se capturó un estado posterior.</p>
                          : <Snapshot valor={cambio.despues} />}
                      </section>
                    </div>
                  </section>
                ))}
                {detalleSeleccionado.movimiento && (
                  <section style={{ marginTop: 16 }}>
                    <h4>Movimiento registrado</h4>
                    <Snapshot valor={detalleSeleccionado.movimiento} />
                  </section>
                )}
                {detalleSeleccionado.datos && (
                  <section style={{ marginTop: 16 }}>
                    <h4>Datos enviados para la acción</h4>
                    <Snapshot valor={detalleSeleccionado.datos} />
                  </section>
                )}
              </>
            ) : (
              <section className="card">
                <p style={{ marginTop: 0 }}>
                  Este registro de auditoría se creó antes de guardar snapshots del estado anterior y posterior.
                </p>
                {detalleSeleccionado.datos !== undefined && (
                  <>
                    <h4>Datos registrados</h4>
                    <Snapshot valor={detalleSeleccionado.datos} />
                  </>
                )}
                {detalleSeleccionado.resultado !== undefined && (
                  <>
                    <h4>Resultado</h4>
                    <Snapshot valor={detalleSeleccionado.resultado} />
                  </>
                )}
              </section>
            )}

          </section>
        </div>
      )}
    </div>
  );
}
