import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recuperarContrasena } from '../services/auth.service';

export default function RecuperarContrasenaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito(false);
    setCargando(true);
    try {
      await recuperarContrasena(email);
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo procesar la solicitud');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-split">
      <aside
        className="login-hero"
        style={{
          backgroundImage: `linear-gradient(rgb(28 43 31 / 45%), rgb(28 43 31 / 45%))`,
        }}
      >
        <div className="login-hero-text">
          <h1>CoopAhorros</h1>
          <p>Recuperación de contraseña</p>
        </div>
      </aside>

      <main className="login-panel">
        {exito ? (
          <div className="login-form">
            <h2>Listo</h2>
            <p className="login-subtitle">Ticket para recuperar contraseña enviado con éxito.</p>
            <div className="alert success" role="alert">
              El administrador ha sido notificado y restablecerá tu contraseña.
            </div>
            <Link to="/login" className="btn primary" style={{ marginTop: 16 }}>
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <h2>¿Olvidaste tu contraseña?</h2>
            <p className="login-subtitle">Ingresa tu correo para generar un ticket de recuperación.</p>

            {error && <div className="alert error" role="alert">{error}</div>}

            <div className="field">
              <label htmlFor="recuperar-email">Correo electrónico</label>
              <input
                id="recuperar-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              className="btn primary"
              type="submit"
              disabled={cargando}
            >
              {cargando ? 'Enviando…' : 'Enviar solicitud'}
            </button>

            <p style={{ marginTop: 16, textAlign: 'center' }}>
              ¿Recuerdas tu contraseña?{' '}
              <Link to="/login" className="login-forgot">
                Inicia sesión
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
