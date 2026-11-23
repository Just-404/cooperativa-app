import { useEffect, useMemo, useState } from 'react';
import { Eye, FilterX, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { listarTickets, actualizarTicket, eliminarTicket } from '../../services/tickets.service';
import usePaginacion from '../../hooks/usePaginacion.js';
import Paginacion from '../../components/common/Paginacion.jsx';
import TicketModal from './TicketModal.jsx';

const POR_PAGINA = 15;

const TIPO_LABEL = {
  forgot_password: 'Recuperar contraseña',
  report_problem: 'Reportar problema',
};

const ESTADO_LABEL = {
  pending: 'Pendiente',
  resolved: 'Resuelto',
  cancelled: 'Cancelado',
};

function labelTipo(tipo) {
  return TIPO_LABEL[tipo] || tipo;
}

function inicioDelDia(fecha) {
  const dia = new Date(fecha);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

function fechaLegible(fecha) {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? 'Fecha no disponible' : valor.toLocaleDateString('es');
}

export default function AdminTicketsPage() {
  const { isReady } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorOperacion, setErrorOperacion] = useState('');
  const [mensajeOperacion, setMensajeOperacion] = useState('');
  const [filtro, setFiltro] = useState({
    estado: '',
    tipo: '',
    periodo: 'todos',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  useEffect(() => {
    if (isReady) cargarTickets();
  }, [isReady]);

  async function cargarTickets() {
    setCargando(true);
    try {
      const { tickets: lista } = await listarTickets();
      setTickets(Array.isArray(lista) ? lista : []);
      setErrorCarga('');
    } catch (err) {
      console.error('Error al cargar los tickets:', err);
      setErrorCarga('No se pudieron cargar los tickets.');
    } finally {
      setCargando(false);
    }
  }

  const rangoInvalido = filtro.periodo === 'personalizado'
    && filtro.fechaDesde
    && filtro.fechaHasta
    && filtro.fechaDesde > filtro.fechaHasta;

  const filtrados = useMemo(() => {
    if (rangoInvalido) return [];

    let desde = null;
    let hasta = null;
    const ahora = new Date();

    if (filtro.periodo === 'hoy') {
      desde = inicioDelDia(ahora);
      hasta = ahora;
    } else if (filtro.periodo === '7dias' || filtro.periodo === '30dias') {
      desde = inicioDelDia(ahora);
      desde.setDate(desde.getDate() - (filtro.periodo === '7dias' ? 6 : 29));
      hasta = ahora;
    } else if (filtro.periodo === 'personalizado') {
      desde = filtro.fechaDesde ? new Date(`${filtro.fechaDesde}T00:00:00`) : null;
      hasta = filtro.fechaHasta ? new Date(`${filtro.fechaHasta}T23:59:59.999`) : null;
    }

    return [...tickets]
      .filter((ticket) => {
        if (filtro.estado && ticket.estado !== filtro.estado) return false;
        if (filtro.tipo && ticket.tipo !== filtro.tipo) return false;

        const fechaTicket = new Date(ticket.fechaCreacion);
        if ((desde || hasta) && Number.isNaN(fechaTicket.getTime())) return false;
        if (desde && fechaTicket < desde) return false;
        if (hasta && fechaTicket > hasta) return false;
        return true;
      })
      .sort((a, b) => {
        const fechaA = Date.parse(a.fechaCreacion);
        const fechaB = Date.parse(b.fechaCreacion);
        return (Number.isFinite(fechaB) ? fechaB : 0) - (Number.isFinite(fechaA) ? fechaA : 0);
      });
  }, [tickets, filtro, rangoInvalido]);

  const {
    visibles,
    paginaActual,
    totalPaginas,
    setPagina,
    desde,
    hasta,
    total,
  } = usePaginacion(filtrados, POR_PAGINA, {
    reiniciarCon: [
      filtro.estado,
      filtro.tipo,
      filtro.periodo,
      filtro.fechaDesde,
      filtro.fechaHasta,
    ],
  });

  function actualizarFiltro(e) {
    const { name, value } = e.target;
    setFiltro((actual) => ({ ...actual, [name]: value }));
  }

  function actualizarFecha(e) {
    const { name, value } = e.target;
    setFiltro((actual) => ({ ...actual, periodo: 'personalizado', [name]: value }));
  }

  async function guardarEstado(id, nuevoEstado) {
    setErrorOperacion('');
    setMensajeOperacion('');
    try {
      await actualizarTicket(id, nuevoEstado);
      setTicketSeleccionado(null);
      setMensajeOperacion('El estado del ticket se actualizó correctamente.');
      await cargarTickets();
    } catch (err) {
      console.error('Error al actualizar el ticket:', err);
      setErrorOperacion('No se pudo actualizar el estado del ticket.');
    }
  }

  async function handleEliminar(id) {
    setErrorOperacion('');
    setMensajeOperacion('');
    try {
      await eliminarTicket(id);
      setTicketSeleccionado(null);
      setMensajeOperacion('El ticket se eliminó correctamente.');
      await cargarTickets();
    } catch (err) {
      console.error('Error al eliminar el ticket:', err);
      setErrorOperacion('No se pudo eliminar el ticket.');
    }
  }

  if (!isReady) return <div>Cargando...</div>;

  const hayFiltros = Boolean(
    filtro.estado
    || filtro.tipo
    || filtro.periodo !== 'todos'
    || filtro.fechaDesde
    || filtro.fechaHasta
  );

  return (
    <div className="tickets-admin">
      <h3>Tickets del Sistema</h3>

      <div className="tickets-admin-filtros" aria-label="Filtros de tickets">
        <select
          aria-label="Filtrar por estado"
          name="estado"
          value={filtro.estado}
          onChange={actualizarFiltro}
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>{etiqueta}</option>
          ))}
        </select>

        <select
          aria-label="Filtrar por tipo"
          name="tipo"
          value={filtro.tipo}
          onChange={actualizarFiltro}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABEL).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>{etiqueta}</option>
          ))}
        </select>

        <select
          aria-label="Filtrar por fecha"
          name="periodo"
          value={filtro.periodo}
          onChange={actualizarFiltro}
        >
          <option value="todos">Todas las fechas</option>
          <option value="hoy">Hoy</option>
          <option value="7dias">Últimos 7 días</option>
          <option value="30dias">Últimos 30 días</option>
          <option value="personalizado">Rango personalizado</option>
        </select>

        {filtro.periodo === 'personalizado' && (
          <div className="tickets-admin-fechas">
            <label>
              Desde
              <input
                type="date"
                name="fechaDesde"
                aria-label="Fecha inicial"
                value={filtro.fechaDesde}
                onChange={actualizarFecha}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                name="fechaHasta"
                aria-label="Fecha final"
                value={filtro.fechaHasta}
                onChange={actualizarFecha}
              />
            </label>
          </div>
        )}

        {hayFiltros && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => setFiltro({
              estado: '',
              tipo: '',
              periodo: 'todos',
              fechaDesde: '',
              fechaHasta: '',
            })}
          >
            <FilterX size={16} aria-hidden="true" /> Limpiar filtros
          </button>
        )}
      </div>

      {rangoInvalido && (
        <div className="alert error" role="alert">
          La fecha inicial no puede ser posterior a la fecha final.
        </div>
      )}
      {errorCarga && (
        <div className="alert error" role="alert">
          {errorCarga}
          <button type="button" className="btn ghost" onClick={cargarTickets}>
            <RefreshCw size={16} aria-hidden="true" /> Reintentar
          </button>
        </div>
      )}
      {errorOperacion && <div className="alert error" role="alert">{errorOperacion}</div>}
      {mensajeOperacion && <div className="alert success" role="status">{mensajeOperacion}</div>}

      <div className="tickets-admin-lista">
        {cargando ? (
          <p role="status">Cargando tickets...</p>
        ) : visibles.length === 0 ? (
          <p className="tickets-admin-vacio">
            {errorCarga
              ? 'No se pudieron mostrar los tickets.'
              : tickets.length === 0
                ? 'No hay tickets registrados.'
                : 'No hay tickets que coincidan con los filtros.'}
          </p>
        ) : (
          <div className="tickets-admin-grid">
            {visibles.map((ticket) => (
              <article
                key={ticket.id}
                className={`tickets-admin-card tickets-admin-estado-${ticket.estado}`}
                aria-label={`${ticket.usuarioNombre || 'Usuario no disponible'}, ${labelTipo(ticket.tipo)}, ${fechaLegible(ticket.fechaCreacion)}, estado ${ESTADO_LABEL[ticket.estado] || ticket.estado}`}
              >
                <h4 title={ticket.titulo}>{ticket.titulo}</h4>
                <p className="tickets-admin-tipo">{labelTipo(ticket.tipo)}</p>
                <p className="tickets-admin-persona">
                  Persona afectada: {ticket.usuarioNombre || 'No disponible'}
                </p>
                <time className="tickets-admin-fecha" dateTime={ticket.fechaCreacion}>
                  {fechaLegible(ticket.fechaCreacion)}
                </time>
                <button
                  type="button"
                  className="btn secondary tickets-admin-ver"
                  onClick={() => setTicketSeleccionado(ticket)}
                  aria-label={`Ver ticket: ${ticket.titulo}`}
                >
                  <Eye size={16} aria-hidden="true" /> Ver
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {!cargando && (
        <Paginacion
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiar={setPagina}
          desde={desde}
          hasta={hasta}
          total={total}
        />
      )}

      {ticketSeleccionado && (
        <TicketModal
          ticket={ticketSeleccionado}
          onClose={() => setTicketSeleccionado(null)}
          onSave={guardarEstado}
          onEliminar={handleEliminar}
        />
      )}
    </div>
  );
}
