import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtener } from '../services/socios.service';
import { abrir, listarPorSocio } from '../../cuentas-ahorro/services/cuentas-ahorro.service';
import { depositar, retirar } from '../../transacciones/services/transacciones.service';
import { obtenerPorSocio, calcular } from '../../scoring/services/scoring.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function SocioDetallePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [socio, setSocio] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [scoring, setScoring] = useState([]);
  const [montoOperacion, setMontoOperacion] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const puedeOperar = ['administrador', 'cajero'].includes(user?.rol);
  const puedeEvaluar = ['administrador', 'oficial_credito'].includes(user?.rol);

  async function cargar() {
    const [s, c, sc] = await Promise.all([
      obtener(id), listarPorSocio(id), obtenerPorSocio(id),
    ]);
    setSocio(s);
    setCuentas(c);
    setScoring(sc);
  }

  useEffect(() => { cargar(); }, [id]);

  async function handleAbrirCuenta() {
    setError(''); setMensaje('');
    try {
      await abrir(id, 0);
      setMensaje('Cuenta de ahorro abierta.');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo abrir la cuenta');
    }
  }

  async function handleOperacion(cuentaId, tipo) {
    setError(''); setMensaje('');
    const monto = Number(montoOperacion[cuentaId] || 0);
    try {
      if (tipo === 'deposito') await depositar(cuentaId, monto);
      else await retirar(cuentaId, monto);
      setMensaje(`${tipo === 'deposito' ? 'Depósito' : 'Retiro'} registrado.`);
      setMontoOperacion({ ...montoOperacion, [cuentaId]: '' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo procesar la operación');
    }
  }

  async function handleCalcularScoring() {
    setError('');
    try {
      await calcular(id);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo calcular el scoring');
    }
  }

  if (!socio) return null;

  return (
    <div>
      <Link to="/socios" style={{ fontSize: '0.82rem' }}>← Volver a socios</Link>
      <h3 style={{ marginTop: 10 }}>{socio.nombre} {socio.apellido}</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
        Documento: <span className="mono">{socio.documento}</span> · <EstadoTag estado={socio.estado} />
      </p>

      {error && <div className="alert error">{error}</div>}
      {mensaje && <div className="alert success">{mensaje}</div>}

      <h4 style={{ marginTop: 26 }}>Cuentas de ahorro</h4>
      {puedeOperar && <button className="btn secondary" onClick={handleAbrirCuenta} style={{ marginBottom: 12 }}>Abrir cuenta de ahorro</button>}

      {cuentas.map((c) => (
        <div key={c.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="mono" style={{ fontWeight: 600 }}>{c.numeroCuenta}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Saldo actual</div>
            </div>
            <div className="mono" style={{ fontSize: '1.2rem', color: 'var(--forest)' }}>
              RD$ {Number(c.saldo).toLocaleString()}
            </div>
          </div>
          {puedeOperar && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                type="number" min="0" placeholder="Monto"
                value={montoOperacion[c.id] || ''}
                onChange={(e) => setMontoOperacion({ ...montoOperacion, [c.id]: e.target.value })}
                style={{ maxWidth: 140 }}
              />
              <button className="btn primary" onClick={() => handleOperacion(c.id, 'deposito')}>Depositar</button>
              <button className="btn secondary" onClick={() => handleOperacion(c.id, 'retiro')}>Retirar</button>
            </div>
          )}
        </div>
      ))}
      {cuentas.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Este socio aún no tiene cuentas de ahorro.</p>}

      <h4 style={{ marginTop: 26 }}>Scoring crediticio</h4>
      {puedeEvaluar && <button className="btn secondary" onClick={handleCalcularScoring} style={{ marginBottom: 12 }}>Calcular scoring</button>}
      <table className="ledger">
        <thead><tr><th>Fecha</th><th>Puntaje</th></tr></thead>
        <tbody>
          {scoring.map((s) => (
            <tr key={s.id}>
              <td>{new Date(s.fechaEvaluacion).toLocaleDateString()}</td>
              <td className="mono">{s.puntaje}</td>
            </tr>
          ))}
          {scoring.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--ink-soft)' }}>Sin evaluaciones aún.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
