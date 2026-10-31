import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { crearTicket } from '../../services/tickets.service';

export function TicketReporte() {
  const { user, isReady } = useAuth();
  const [mostrar, setMostrar] = useState(false);
  const [tipo, setTipo] = useState('report_problem');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  if (!isReady) return null;

  function limpiar() {
    setTitulo('');
    setDescripcion('');
    setNombreUsuario('');
    setError('');
    setExito(false);
    setMostrar(false);
  }

  function enviar(e) {
    e.preventDefault();
    if (!titulo || !descripcion || !nombreUsuario) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    crearTicket(tipo, titulo, descripcion, nombreUsuario)
      .then(() => {
        setExito(true);
        setTimeout(() => {
          limpiar();
          setMostrar(false);
        }, 3000);
      })
      .catch((err) => {
        setError(err.response?.data?.error?.message || 'Error al crear el ticket');
      });
  }

  function cerrar() {
    setMostrar(false);
    limpiar();
  }

  return (
    <div>
      {mostrar && (
        <div className="ticket-reporte-backdrop" onMouseDown={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}>
          <div className="ticket-reporte-modal">
            <header className="ticket-reporte-header">
              <h3>
                {tipo === 'forgot_password' ? 'Recuperar contraseña' : 'Reportar problema'}
              </h3>
            </header>

            {error && <div className="alert error">{error}</div>}
            {exito && <div className="alert success">Ticket creado exitosamente</div>}

            <form onSubmit={enviar} className="ticket-reporte-form">
              <div className="ticket-reporte-field">
                <label>Nombre de usuario</label>
                <input
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="Tu nombre de usuario"
                  required
                />
              </div>

              <div className="ticket-reporte-field">
                <label>Título</label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Breve descripción del problema"
                  required
                />
              </div>

              <div className="ticket-reporte-field">
                <label>Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Detalla el problema o qué sucedió"
                  required
                ></textarea>
              </div>

              <div className="ticket-reporte-actions">
                <button type="button" className="ticket-reporte-btn-cancelar" onClick={cerrar}>
                  Cancelar
                </button>
                <button type="submit" className="ticket-reporte-btn-enviar">
                  Enviar ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn ghost"
        onClick={() => setMostrar(true)}
      >
        {tipo === 'forgot_password'
          ? '¿Olvidaste tu contraseña?'
          : 'Reportar problema'}
      </button>
    </div>
  );
}
