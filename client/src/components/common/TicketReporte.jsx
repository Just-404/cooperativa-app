import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquareWarning, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { crearTicket } from '../../services/tickets.service';

export function TicketReporte({ collapsed = false }) {
  const { user, isReady } = useAuth();
  const [mostrar, setMostrar] = useState(false);
  const [tipo, setTipo] = useState('report_problem');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const LIMITE_TITULO = 45;
  const LIMITE_DESCRIPCION = 2000;
  const nombreUsuario = user?.nombre || '';

  if (!isReady) return null;

  function limpiar() {
    setTitulo('');
    setDescripcion('');
    setError('');
    setExito(false);
    setMostrar(false);
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando || exito) return;
    if (!titulo.trim() || !descripcion.trim() || !nombreUsuario) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (titulo.trim().length > LIMITE_TITULO) {
      setError(`El título no puede superar los ${LIMITE_TITULO} caracteres`);
      return;
    }
    if (descripcion.trim().length > LIMITE_DESCRIPCION) {
      setError(`La descripción no puede superar los ${LIMITE_DESCRIPCION} caracteres`);
      return;
    }

    setError('');
    setEnviando(true);
    try {
      await crearTicket(tipo, titulo.trim(), descripcion.trim());
      setExito(true);
      setTimeout(() => {
        limpiar();
        setMostrar(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al crear el ticket');
    } finally {
      setEnviando(false);
    }
  }

  function cerrar() {
    setMostrar(false);
    limpiar();
  }

  const etiqueta = tipo === 'forgot_password'
    ? '¿Olvidaste tu contraseña?'
    : 'Reportar problema';

  return (
    <div>
      {mostrar && createPortal(
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
                  readOnly
                  aria-readonly="true"
                  required
                />
              </div>

              <div className="ticket-reporte-field">
                <label htmlFor="ticket-titulo">Título</label>
                <input
                  id="ticket-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Breve descripción del problema"
                  maxLength={LIMITE_TITULO}
                  required
                />
                <small className="character-counter" aria-live="polite">
                  {titulo.length}/{LIMITE_TITULO}
                </small>
              </div>

              <div className="ticket-reporte-field">
                <label htmlFor="ticket-descripcion">Descripción</label>
                <textarea
                  id="ticket-descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Detalla el problema o qué sucedió"
                  maxLength={LIMITE_DESCRIPCION}
                  required
                ></textarea>
                <small className="character-counter" aria-live="polite">
                  {descripcion.length}/{LIMITE_DESCRIPCION}
                </small>
              </div>

              <div className="ticket-reporte-actions">
                <button type="button" className="ticket-reporte-btn-cancelar" onClick={cerrar}>
                  <X size={15} aria-hidden="true" /> Cancelar
                </button>
                <button type="submit" className="ticket-reporte-btn-enviar" disabled={enviando || exito}>
                  <Send size={15} aria-hidden="true" />
                  {enviando ? 'Enviando...' : exito ? 'Enviado' : 'Enviar ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <button
        type="button"
        className="btn ghost sidebar-action aside-footer-btn"
        onClick={() => setMostrar(true)}
        title={collapsed ? etiqueta : undefined}
      >
        <MessageSquareWarning
          className="sidebar-icon"
          size={18}
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <span className="sidebar-label">{etiqueta}</span>
      </button>
    </div>
  );
}
