import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { listarTickets, actualizarTicket, eliminarTicket } from '../../services/tickets.service';
import TicketModal from './TicketModal.jsx';

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

function labelEstado(estado) {
  return ESTADO_LABEL[estado] || estado;
}

export default function AdminTicketsPage() {
  const { user, isReady } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState({ estado: null, tipo: null });
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  if (!isReady) return <div>Cargando...</div>;

  useEffect(() => {
    cargarTickets();
  }, []);

  function cargarTickets() {
    setCargando(true);
    listarTickets(filtro).then(({ tickets }) => {
      setTickets(tickets);
      setCargando(false);
    });
  }

  function aplicarFiltro(e) {
    const valor = e.target.value;
    setFiltro({
      ...filtro,
      [e.target.name]: valor === '' ? null : valor,
    });
    cargarTickets();
  }

  function verTicket(ticket) {
    setTicketSeleccionado(ticket);
  }

  function cerrarTicket() {
    setTicketSeleccionado(null);
  }

  async function guardarEstado(id, nuevoEstado) {
    try {
      await actualizarTicket(id, nuevoEstado);
      cargarTickets();
      cerrarTicket();
    } catch (err) {
      console.error('Error al actualizar el ticket:', err);
    }
  }

  async function handleEliminar(id) {
    try {
      await eliminarTicket(id);
      cargarTickets();
      cerrarTicket();
    } catch (err) {
      console.error('Error al eliminar el ticket:', err);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3>Tickets del Sistema</h3>

      <div style={{ margin: '16px 0', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <select
          style={{ padding: '8px' }}
          name="estado"
          value={filtro.estado || ''}
          onChange={aplicarFiltro}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="resolved">Resuelto</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          style={{ padding: '8px' }}
          name="tipo"
          value={filtro.tipo || ''}
          onChange={aplicarFiltro}
        >
          <option value="">Todos los tipos</option>
          <option value="forgot_password">Recuperar contraseña</option>
          <option value="report_problem">Reportar problema</option>
        </select>
      </div>

      <div style={{ overflow: 'auto', margin: '16px 0', maxHeight: '500px' }}>
        {cargando ? (
          'Cargando tickets...'
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                margin: '8px 0',
                background: ticketSeleccionado && ticketSeleccionado.id === t.id ? 'var(--hover)' : 'white',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: '4px 0' }}>
                {t.titulo}
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.75rem', margin: '4px 0' }}>
                {t.usuarioNombre} • {labelTipo(t.tipo)} • {labelEstado(t.estado)}
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', margin: '4px 0' }}>
                {(t.descripcion || '').substring(0, 80)}{(t.descripcion || '').length > 80 ? '...' : ''}
              </div>
              <div>
                <button
                  style={{
                    margin: '4px 0',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    color: 'var(--primary)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => verTicket(t)}
                >
                  Ver
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {ticketSeleccionado && (
        <TicketModal
          ticket={ticketSeleccionado}
          onClose={cerrarTicket}
          onSave={guardarEstado}
          onEliminar={handleEliminar}
        />
      )}
    </div>
  );
}
