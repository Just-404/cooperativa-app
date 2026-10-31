import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtener } from '../services/prestamos.service';
import { evaluar } from '../../evaluacion/services/evaluacion.service';
import { aprobar, rechazar } from '../../aprobacion/services/aprobacion.service';
import { desembolsar } from '../../desembolso/services/desembolso.service';
import { listarCuotas, registrarPago, registrarAbonoCapital, recalcularFechasCuotas } from '../../cuotas-pagos/services/cuotas-pagos.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { formatearFecha, nombreDia } from '../../../utils/fecha';

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
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [cuotasPagadas, setCuotasPagadas] = useState(0);
  const [totalPrestamoConIntereses, setTotalPrestamoConIntereses] = useState(0);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [abonoMonto, setAbonoMonto] = useState('');

  const puedeEvaluar = ['administrador', 'oficial_credito'].includes(user?.rol);
  const puedeAprobar = ['administrador', 'gerente'].includes(user?.rol);
  const puedeDesembolsar = ['administrador', 'cajero'].includes(user?.rol);
  const puedeRegistrarPago = ['administrador', 'cajero'].includes(user?.rol);

  async function cargar() {
    const p = await obtener(id);
    setPrestamo(p);
    if (['desembolsado', 'cerrado'].includes(p.estado)) {
      const c = await listarCuotas(id);
      setCuotas(c);
      const pendiente = c.filter((cuota) => cuota.estado !== 'pagada').reduce(
        (sum, cuota) => sum + Number(cuota.montoTotal) + Number(cuota.montoMora || 0),
        0
      );
      const pagadas = c.filter((cuota) => cuota.estado === 'pagada').length;
      const totalConIntereses = c.reduce(
        (sum, cuota) => sum + Number(cuota.montoTotal),
        0
      );
      setTotalPendiente(pendiente);
      setCuotasPagadas(pagadas);
      setTotalPrestamoConIntereses(totalConIntereses);
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

  async function handleAbonoCapital() {
    setError(''); setMensaje('');
    if (!abonoMonto || Number(abonoMonto) <= 0) {
      setError('Ingrese un monto válido para el abono');
      return;
    }
    try {
      await registrarAbonoCapital(id, Number(abonoMonto));
      setAbonoMonto('');
      setMensaje('Abono a capital registrado. Las cuotas futuras se han reducido.');
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo registrar el abono');
    }
  }

  async function handleRecalcularFechas() {
    setError(''); setMensaje('');
    try {
      const resultado = await recalcularFechasCuotas(id);
      setMensaje(`Fechas de vencimiento actualizadas (${resultado.cuotasActualizadas} cuota(s) modificada(s))`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudieron recalcular las fechas');
    }
  }

  if (!prestamo) return null;
  const rechazado = prestamo.estado === 'rechazado';
  const pasoActualIdx = Math.max(0, PASOS.findIndex((p) => p.estado === prestamo.estado));

  // Verificar si hay cuotas anteriores impagas para cada cuota
  const cuotasConBloqueo = cuotas.map((c, idx) => {
    const cuotasAnterioresImpagas = cuotas
      .slice(0, idx)
      .some(prev => prev.estado !== 'pagada');
    return { ...c, bloqueada: cuotasAnterioresImpagas && c.estado !== 'pagada' };
  });

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

      {rechazado ? (
        <div className="alert error" style={{ margin: '20px 0 26px' }}>
          <strong>Solicitud rechazada</strong>
          <p style={{ margin: '6px 0 0' }}>
            <strong>Motivo:</strong>{' '}
            {prestamo.comentarioAprobacion?.trim() || 'No se registró un motivo para el rechazo.'}
          </p>
        </div>
      ) : (
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
      )}

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ margin: 0 }}>Cuotas</h4>
            {puedeRegistrarPago && (
              <div className="card" style={{ padding: 12, maxWidth: 350, margin: 0, boxShadow: 'none'}}>
                <label style={{ display: 'block', marginBottom: 6 }}>Abono a capital</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Monto"
                    value={abonoMonto}
                    onChange={(e) => setAbonoMonto(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn primary" onClick={handleAbonoCapital}>Aplicar abono</button>
                </div>
                <small style={{ color: 'var(--ink-soft)' }}>Reduce el capital de las cuotas pendientes en orden.</small>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Total a pagar (pendiente)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)', fontFamily: "'Roboto Slab', serif" }}>
                RD$ {totalPendiente.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Cuotas pagadas</div>
              <div style={{ fontSize: '1rem', color: 'var(--ink)' }}>{cuotasPagadas} de {cuotas.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Total préstamo (capital + intereses)</div>
              <div style={{ fontSize: '1rem', color: 'var(--ink)' }}>RD$ {totalPrestamoConIntereses.toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={handleRecalcularFechas}
                disabled={prestamo.estado !== 'desembolsado' && prestamo.estado !== 'cerrado'}
              >
                Recalcular fechas de vencimiento
              </button>
              <small style={{ color: 'var(--ink-soft)' }}>Ajusta feriados y fines de semana</small>
            </div>
          </div>

          <table className="ledger">
            <thead><tr><th>#</th><th>Vencimiento</th><th>Capital</th><th>Interés</th><th>Mora</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {cuotasConBloqueo.map((c) => {
                const total = Number(c.montoTotal) + Number(c.montoMora || 0);
                const puedePagar = c.estado !== 'pagada' && puedeRegistrarPago && !c.bloqueada;
                return (
                  <tr key={c.id} style={{ opacity: c.bloqueada && c.estado !== 'pagada' ? 0.6 : 1 }}>
                    <td>{c.numeroCuota}</td>
                    <td>
                      {formatearFecha(c.fechaVencimiento)}{' '}
                      <small style={{ color: 'var(--ink-soft)' }}>{nombreDia(c.fechaVencimiento)}</small>
                    </td>
                    <td className="mono">{Number(c.montoCapital).toLocaleString()}</td>
                    <td className="mono">{Number(c.montoInteres).toLocaleString()}</td>
                    <td className="mono">{Number(c.montoMora || 0).toLocaleString()}</td>
                    <td className="mono">{total.toLocaleString()}</td>
                    <td><EstadoTag estado={c.estado} /></td>
                    <td>
                      {c.estado !== 'pagada' && puedeRegistrarPago && (
                        <button
                          className="btn ghost"
                          onClick={() => handlePago(c)}
                          disabled={c.bloqueada}
                          title={c.bloqueada ? 'Debe pagar las cuotas anteriores primero' : ''}
                        >
                          {c.bloqueada ? 'Bloqueada' : 'Registrar pago'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {cuotasConBloqueo.some(c => c.bloqueada && c.estado !== 'pagada') && (
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', marginTop: 8 }}>
              Las cuotas en gris están bloqueadas: debe pagar las anteriores en orden.
            </p>
          )}
        </>
      )}
    </div>
  );
}
