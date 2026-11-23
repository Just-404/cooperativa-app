import { useEffect, useState } from 'react';
import { Info, Save } from 'lucide-react';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';
import { formatearFecha } from '../../../utils/fecha.js';
import * as configuracion from '../services/configuracion.service';

export default function MoraSection({ config, puedeEditar, onCambio, onError }) {
  const mora = config.mora || {};
  const [tasaMensual, setTasaMensual] = useState(mora.tasaMensual ?? 3);
  const [confirmar, setConfirmar] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    setTasaMensual(mora.tasaMensual ?? 3);
  }, [mora.tasaMensual]);

  const tasaDiaria = (Number(tasaMensual) || 0) / 100 / 30;
  const ejemplo = Math.round(10000 * tasaDiaria * 10 * 100) / 100;

  async function guardar() {
    setProcesando(true);
    onError('');
    try {
      await configuracion.actualizarTasaMora(Number(tasaMensual));
      setConfirmar(false);
      await onCambio();
    } catch (err) {
      onError(err.response?.data?.error?.message || 'No se pudo actualizar la tasa de mora');
      setConfirmar(false);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section className="config-section" aria-labelledby="config-mora-titulo">
      <div className="config-section-header">
        <div>
          <h3 id="config-mora-titulo">Tasa de mora</h3>
          <p className="config-section-description">
            Se captura como porcentaje mensual y se aplica diariamente sobre el monto total de la cuota vencida.
          </p>
        </div>
      </div>

      <div className="config-mora-cards">
        <div className="config-mora-card">
          <span className="config-mora-label">Tasa vigente</span>
          <strong>{Number(mora.tasaMensual || 0).toFixed(2)}% mensual</strong>
          <span className="config-mora-detalle">
            {((Number(mora.tasaDiaria || 0)) * 100).toFixed(3)}% diario · desde {formatearFecha(mora.vigenteDesde)}
          </span>
        </div>
        <div className="config-mora-card">
          <span className="config-mora-label">Ejemplo con la tasa propuesta</span>
          <strong>RD$ {ejemplo.toFixed(2)}</strong>
          <span className="config-mora-detalle">RD$ 10,000 con 10 días de atraso</span>
        </div>
      </div>

      {puedeEditar && (
        <div className="config-mora-form">
          <div className="field">
            <label htmlFor="config-tasa-mensual">Nueva tasa mensual (%)</label>
            <input
              id="config-tasa-mensual"
              type="number"
              min="0"
              max="20"
              step="0.01"
              value={tasaMensual}
              onChange={(e) => setTasaMensual(e.target.value)}
            />
            <small>Equivale a {(tasaDiaria * 100).toFixed(3)}% diario (mes de 30 días).</small>
          </div>
          <button type="button" className="btn primary" onClick={() => setConfirmar(true)} disabled={procesando}>
            <Save size={16} aria-hidden="true" /> Guardar tasa
          </button>
        </div>
      )}

      <div className="config-table-wrap">
        <table className="ledger config-table">
          <thead>
            <tr>
              <th>Vigente desde</th>
              <th>Mensual</th>
              <th>Diaria</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {(mora.historial || []).slice().reverse().map((tasa) => (
              <tr key={tasa.id}>
                <td className="mono">{formatearFecha(tasa.vigenteDesde)}</td>
                <td>{Number(tasa.tasaMensual).toFixed(2)}%</td>
                <td className="mono">{(Number(tasa.tasaDiaria) * 100).toFixed(3)}%</td>
                <td>{tasa.creadoPor || 'Sistema'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="config-help">
        <Info size={14} aria-hidden="true" /> Las cuotas vencidas conservan la tasa que tenían al vencer; la nueva tasa solo aplica a vencimientos posteriores.
      </p>

      {confirmar && (
        <ConfirmacionModal
          titulo="¿Cambiar la tasa de mora?"
          mensaje={`La nueva tasa (${Number(tasaMensual).toFixed(2)}% mensual) aplicará solo a cuotas con vencimiento posterior a hoy. Las cuotas ya vencidas mantienen su tasa original.`}
          confirmarTexto="Guardar tasa"
          procesando={procesando}
          onConfirmar={guardar}
          onCancelar={() => setConfirmar(false)}
        />
      )}
    </section>
  );
}
