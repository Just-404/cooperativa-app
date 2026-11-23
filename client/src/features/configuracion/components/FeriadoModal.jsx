import { useState } from 'react';
import { Save, X } from 'lucide-react';

export default function FeriadoModal({ feriado, anio, onGuardar, onCancelar, procesando = false }) {
  const [nombre, setNombre] = useState(feriado?.nombre || '');
  const [fecha, setFecha] = useState(feriado?.fecha || `${anio}-01-01`);

  function handleSubmit(event) {
    event.preventDefault();
    onGuardar({
      nombre: nombre.trim(),
      fecha,
      ...(feriado ? {} : { anio: Number(fecha.slice(0, 4)) }),
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !procesando) onCancelar(); }}>
      <form onSubmit={handleSubmit} className="card config-modal" role="dialog" aria-modal="true" aria-labelledby="feriado-modal-titulo">
        <h3 id="feriado-modal-titulo">{feriado ? 'Editar feriado' : 'Agregar fecha no laborable'}</h3>
        <p className="config-modal-description">
          {feriado
            ? 'El cambio se aplicará al calendario del año seleccionado.'
            : 'La fecha quedará registrada como personalizada y podrás eliminarla cuando quieras.'}
        </p>

        <div className="field">
          <label htmlFor="feriado-nombre">Nombre</label>
          <input
            id="feriado-nombre"
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={150}
            placeholder="Ej. Día de la Cooperativa"
          />
        </div>

        <div className="field">
          <label htmlFor="feriado-fecha">Fecha</label>
          <input
            id="feriado-fecha"
            type="date"
            value={fecha}
            min={`${anio}-01-01`}
            max={`${anio}-12-31`}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <div className="config-modal-actions">
          <button type="button" className="btn secondary" onClick={onCancelar} disabled={procesando}>
            <X size={16} aria-hidden="true" /> Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={procesando}>
            <Save size={16} aria-hidden="true" /> {procesando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
