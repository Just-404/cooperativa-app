import { useEffect, useState } from 'react';
import { CalendarCheck, Info, Save } from 'lucide-react';
import { formatearFecha, nombreDia } from '../../../utils/fecha.js';
import * as configuracion from '../services/configuracion.service';
import { siguienteDiaLaborableLocal } from '../utils/calendario.js';

const DIAS = [
  { valor: 0, etiqueta: 'Domingo' },
  { valor: 1, etiqueta: 'Lunes' },
  { valor: 2, etiqueta: 'Martes' },
  { valor: 3, etiqueta: 'Miércoles' },
  { valor: 4, etiqueta: 'Jueves' },
  { valor: 5, etiqueta: 'Viernes' },
  { valor: 6, etiqueta: 'Sábado' },
];

export default function DiasLaborablesSection({ config, soloLectura, onCambio, onError }) {
  const [dias, setDias] = useState(config.diasNoLaborables || [0, 6]);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    setDias(config.diasNoLaborables || [0, 6]);
  }, [config.diasNoLaborables]);

  function alternar(dia) {
    setDias((prev) => (
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    ));
  }

  const sinCambios = JSON.stringify([...dias].sort()) === JSON.stringify([...(config.diasNoLaborables || [])].sort());
  const siguiente = siguienteDiaLaborableLocal(config.feriados || [], dias);

  async function guardar() {
    setProcesando(true);
    onError('');
    try {
      await configuracion.actualizarDiasNoLaborables(dias);
      await onCambio();
    } catch (err) {
      onError(err.response?.data?.error?.message || 'No se pudieron guardar los días no laborables');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section className="config-section" aria-labelledby="config-dias-titulo">
      <div className="config-section-header">
        <div>
          <h3 id="config-dias-titulo">Días laborables</h3>
          <p className="config-section-description">
            Marca los días de la semana en que la cooperativa no atiende. Debe quedar al menos un día laborable.
          </p>
        </div>
      </div>

      <div className="config-week-grid">
        {DIAS.map((dia) => (
          <label key={dia.valor} className={`config-day${dias.includes(dia.valor) ? ' is-off' : ''}${soloLectura ? ' is-readonly' : ''}`}>
            <input
              type="checkbox"
              checked={dias.includes(dia.valor)}
              onChange={() => alternar(dia.valor)}
              disabled={soloLectura || procesando}
            />
            <span>{dia.etiqueta}</span>
            <small>{dias.includes(dia.valor) ? 'No laborable' : 'Laborable'}</small>
          </label>
        ))}
      </div>

      <div className="config-preview">
        <CalendarCheck size={18} aria-hidden="true" />
        <div>
          <strong>Próximo día laborable</strong>
          <span>
            {nombreDia(siguiente)} {formatearFecha(siguiente)} — teniendo en cuenta los feriados de {config.anio}
          </span>
        </div>
      </div>

      {!soloLectura && (
        <div className="config-section-actions">
          <button type="button" className="btn primary" onClick={guardar} disabled={sinCambios || dias.length === 7 || procesando}>
            <Save size={16} aria-hidden="true" /> {procesando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      )}
      {soloLectura && (
        <p className="config-help"><Info size={14} aria-hidden="true" /> Solo el administrador puede modificar los días laborables.</p>
      )}
    </section>
  );
}
