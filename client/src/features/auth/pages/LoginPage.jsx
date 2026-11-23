import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import fondoLogin from '../../../img/fondo-login.jpg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-split">
        <aside
          className="login-hero"
          style={{
            backgroundImage: `linear-gradient(180deg, rgb(28 43 31 / 55%), rgb(28 43 31 / 68%)), url(${fondoLogin})`,
          }}
        >
          <div className="login-hero-text">
            <h1>CoopAhorros</h1>
            <p>Bienvenido al sistema de gestión de la cooperativa</p>
          </div>
        </aside>

        <main className="login-panel">
          <form onSubmit={handleSubmit} className="login-form">
            <h2>Iniciar sesión</h2>
            <p className="login-subtitle">Ingresa con tu cuenta del sistema</p>

            {error && <div className="alert error" role="alert">{error}</div>}

            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="password-wrap">
                <input
                  id="login-password"
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verPassword}
                >
                  {verPassword
                    ? <EyeOff size={20} aria-hidden="true" />
                    : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button className="btn primary login-submit" type="submit" disabled={cargando}>
              <LogIn size={16} aria-hidden="true" /> {cargando ? 'Ingresando…' : 'Ingresar'}
            </button>

            <Link to="/recuperar-contraseña" className="login-forgot">¿Olvidaste tu contraseña?</Link>
          </form>
        </main>
      </div>
    </div>
  );
}
