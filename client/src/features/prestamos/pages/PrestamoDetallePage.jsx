import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtener } from '../services/prestamos.service';
import { evaluar } from '../../evaluacion/services/evaluacion.service';
import { aprobar, rechazar } from '../../aprobacion/services/aprobacion.service';
import { desembolsar } from '../../desembolso/services/desembolso.service';
import { listarCuotas, registrarPago } from '../../cuotas-pagos/services/cuotas-pagos.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const PASOS = [
  { estado: 'solicitado', label: 'Solicitud' },
  { estado: 'evaluado', label: 'Evaluación' },
  { estado: 'aprobado', label: 'Aprobación' },
  { estado: 'desembolsado', label: 'Desembolso' },
  { estado: 'cerrado', label: 'Cuotas / pago' },
];

export default function PrestamoDetallePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [prestamo, setPrestamo] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const puedeEvaluar = ['administrador', 'oficial_credito'].includes(user?.rol);
  const puedeAprobar = ['administrador', 'gerente'].includes(user?.rol);
  const puedeDesembolsar = ['administrador', 'cajero'].includes(user?.rol);
  const puedeRegistrarPago = ['administrador', 'cajero'].includes(user?.rol);

  async function cargar() {
    const p = await obtener(id);
    setPrestamo(p);
    if (['desembolsado', 'cerrado'].includes(p.estado)) {
      setCuotas(await listarCuotas(id));
    }
  }

  useEffect(() => { cargar(); }, [id]);

  async function accion(fn) {
    setError(''); setMensaje('');
    try {
      await fn();
      setComentario('');
      setMensaje('Acción realizada correctamente.');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo completar la acción');
    }
  }

  async function handlePago(cuota) {
    setError(''); setMensaje('');
    const total = Number(cuota.montoTotal) + Number(cuota.montoMora || 0);
    try {
      await registrarPago(cuota.id, total);
      setMensaje('Pago registrado.');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo registrar el pago');
    }
  }

  if (!prestamo) return null;
  const pasoActualIdx = Math.max(0, PASOS.findIndex((p) => p.estado === prestamo.estado));

  return (
    <div>
      <Link to="/prestamos" style={{ fontSize: '0.82rem' }}>← Volver a préstamos</Link>
      <h3 style={{ marginTop: 10 }}>
        {prestamo.socio?.nombre} {prestamo.socio?.apellido} — {prestamo.tipoPrestamo?.nombre}
      </h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
        Solicitado: <span className="mono">RD$ {Number(prestamo.montoSolicitado).toLocaleString()}</span> ·
        Plazo: {prestamo.plazoMeses} meses · <EstadoTag estado={prestamo.estado} />
      </p>

      {error && <div className="alert error">{error}</div>}
      {mensaje && <div className="alert success">{mensaje}</div>}

      <div style={{ display: 'flex', gap: 6, margin: '20px 0 26px', flexWrap: 'wrap' }}>
        {PASOS.map((p, idx) => (
          <span key={p.estado} className="tag-status" style={{
            color: idx <= pasoActualIdx ? 'var(--forest)' : 'var(--ink-soft)',
            opacity: idx <= pasoActualIdx ? 1 : 0.5,
          }}>
            {idx + 1}. {p.label}
          </span>
        ))}
      </div>

      {prestamo.estado === 'solicitado' && puedeEvaluar && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 20 }}>
          <label>Comentario de evaluación</label>
          <textarea rows="2" value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ marginBottom: 10 }} />
          <button className="btn primary" onClick={() => accion(() => evaluar(id, comentario))}>Marcar como evaluado</button>
        </div>
      )}

      {prestamo.estado === 'evaluado' && puedeAprobar && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 20 }}>
          <label>Comentario</label>
          <textarea rows="2" value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={() => accion(() => aprobar(id, prestamo.montoSolicitado, comentario))}>Aprobar</button>
            <button className="btn danger" onClick={() => accion(() => rechazar(id, comentario))}>Rechazar</button>
          </div>
        </div>
      )}

      {prestamo.estado === 'aprobado' && puedeDesembolsar && (
        <div className="card" style={{ maxWidth: 480, marginBottom: 20 }}>
          <p style={{ marginTop: 0 }}>Monto aprobado: <span className="mono">RD$ {Number(prestamo.montoAprobado).toLocaleString()}</span></p>
          <button className="btn primary" onClick={() => accion(() => desembolsar(id))}>Desembolsar y generar cuotas</button>
        </div>
      )}

      {cuotas.length > 0 && (
        <>
          <h4>Cuotas</h4>
          <table className="ledger">
            <thead><tr><th>#</th><th>Vencimiento</th><th>Capital</th><th>Interés</th><th>Mora</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {cuotas.map((c) => {
                const total = Number(c.montoTotal) + Number(c.montoMora || 0);
                return (
                  <tr key={c.id}>
                    <td>{c.numeroCuota}</td>
                    <td>{new Date(c.fechaVencimiento).toLocaleDateString()}</td>
                    <td className="mono">{Number(c.montoCapital).toLocaleString()}</td>
                    <td className="mono">{Number(c.montoInteres).toLocaleString()}</td>
                    <td className="mono">{Number(c.montoMora || 0).toLocaleString()}</td>
                    <td className="mono">{total.toLocaleString()}</td>
                    <td><EstadoTag estado={c.estado} /></td>
                    <td>
                      {c.estado !== 'pagada' && puedeRegistrarPago && (
                        <button className="btn ghost" onClick={() => handlePago(c)}>Registrar pago</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
