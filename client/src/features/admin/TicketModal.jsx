import { useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';

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

function fechaLegible(fecha) {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? 'No disponible' : valor.toLocaleString('es');
}

export default function TicketModal({
  ticket,
  onClose,
  onSave,
  onEliminar,
}) {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(ticket.estado);

  const tiposEstado = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'resolved', label: 'Resuelto' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  function handleSave() {
    if (onSave) {
      onSave(ticket.id, estadoSeleccionado);
    }
  }

  function handleEliminar() {
    const confirmado = window.confirm(
      `¿Está seguro que desea eliminar el ticket "${ticket.titulo}"? Esta acción no se puede deshacer.`
    );
    if (confirmado && onEliminar) {
      onEliminar(ticket.id);
    }
  }

  return (
    <div className="ticket-modal-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <section className="card ticket-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-titulo">
        <header className="ticket-modal-header">
          <h3 id="ticket-modal-titulo">Detalle del ticket</h3>
          <button
            type="button"
            className="ticket-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="ticket-modal-body">
          <p><strong>Título:</strong> {ticket.titulo}</p>
          <p><strong>Usuario afectado:</strong> {ticket.usuarioNombre || 'No disponible'}</p>
          <p><strong>Tipo:</strong> {labelTipo(ticket.tipo)}</p>
          <p><strong>Fecha del ticket:</strong> {fechaLegible(ticket.fechaCreacion)}</p>
          <p><strong>Descripción:</strong> {ticket.descripcion || 'Sin descripción'}</p>
          <p><strong>Estado actual:</strong> {labelEstado(ticket.estado)}</p>
        </div>

        <div className="ticket-modal-field">
          <label>Cambiar estado</label>
          <select
            value={estadoSeleccionado}
            onChange={(e) => setEstadoSeleccionado(e.target.value)}
          >
            {tiposEstado.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ticket-modal-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={onClose}
          >
            <X size={16} aria-hidden="true" /> Cerrar
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={handleEliminar}
          >
            <Trash2 size={16} aria-hidden="true" /> Eliminar ticket
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
          >
            <Save size={16} aria-hidden="true" /> Guardar cambios
          </button>
        </div>
      </section>
    </div>
  );
}
