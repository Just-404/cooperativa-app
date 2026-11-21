import { useState } from 'react';
import {
  CalendarPlus,
  Pencil,
  Power,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';
import { formatearFecha } from '../../../utils/fecha.js';
import * as configuracion from '../services/configuracion.service';
import FeriadoModal from './FeriadoModal.jsx';

const TIPO_LABEL = {
  fijo: 'Fijo',
  trasladable: 'Trasladable',
  movil: 'Móvil',
  personalizado: 'Personalizado',
};

export default function FeriadosSection({ config, soloLectura, onCambio, onError }) {
  const [modal, setModal] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [procesando, setProcesando] = useState(false);

  async function ejecutar(accion, mensajeError) {
    setProcesando(true);
    onError('');
    try {
      await accion();
      setModal(null);
      setConfirmacion(null);
      await onCambio();
    } catch (err) {
      onError(err.response?.data?.error?.message || mensajeError);
      setConfirmacion(null);
    } finally {
      setProcesando(false);
    }
  }

  function guardarFeriado(datos) {
    ejecutar(
      () => (modal?.feriado
        ? configuracion.actualizarFeriado(modal.feriado.id, datos)
        : configuracion.crearFeriado(datos)),
      'No se pudo guardar la fecha'
    );
  }

  function alternarActivo(feriado) {
    ejecutar(
      () => configuracion.actualizarFeriado(feriado.id, { activo: !feriado.activo }),
      'No se pudo cambiar el estado del feriado'
    );
  }

  function confirmarEliminar() {
    ejecutar(
      () => configuracion.eliminarFeriado(confirmacion.id),
      'No se pudo eliminar la fecha'
    );
  }

  function confirmarRestaurar() {
    ejecutar(
      () => configuracion.restaurarFeriados(config.anio),
      'No se pudo restaurar el calendario oficial'
    );
  }

  return (
    <section className="config-section" aria-labelledby="config-feriados-titulo">
      <div className="config-section-header">
        <div>
          <h3 id="config-feriados-titulo">Feriados y fechas no laborables</h3>
          <p className="config-section-description">
            Calendario {config.anio}. Los feriados oficiales se generan según la Ley 139-97.
          </p>
        </div>
        {!soloLectura && (
          <div className="config-section-actions">
            <button type="button" className="btn secondary" onClick={() => setConfirmacion({ tipo: 'restaurar' })} disabled={procesando}>
              <RotateCcw size={16} aria-hidden="true" /> Restaurar oficiales
            </button>
            <button type="button" className="btn primary" onClick={() => setModal({ feriado: null })} disabled={procesando}>
              <CalendarPlus size={16} aria-hidden="true" /> Agregar fecha
            </button>
          </div>
        )}
      </div>

      <div className="config-table-wrap">
        <table className="ledger config-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Fecha legal</th>
              <th>Fecha observada</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(config.feriados || []).map((feriado) => (
              <tr key={feriado.id} className={feriado.activo ? '' : 'config-row-inactiva'}>
                <td>
                  <strong>{feriado.nombre}</strong>
                  {feriado.fechaOriginal && feriado.fechaOriginal !== feriado.fecha && (
                    <small className="config-nota">Trasladado desde {formatearFecha(feriado.fechaOriginal)}</small>
                  )}
                </td>
                <td className="mono">{feriado.fechaOriginal ? formatearFecha(feriado.fechaOriginal) : '—'}</td>
                <td className="mono">{formatearFecha(feriado.fecha)}</td>
                <td>{TIPO_LABEL[feriado.tipo] || feriado.origen}</td>
                <td>
                  <span className={`config-estado${feriado.activo ? ' activo' : ''}`}>
                    {feriado.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="config-row-actions">
                    {!soloLectura && (
                      <>
                        <button type="button" className="btn ghost btn-icon" title="Editar feriado" onClick={() => setModal({ feriado })} disabled={procesando}>
                          <Pencil size={15} aria-hidden="true" /> Editar
                        </button>
                        <button type="button" className="btn ghost btn-icon" title={feriado.activo ? 'Desactivar feriado' : 'Activar feriado'} onClick={() => alternarActivo(feriado)} disabled={procesando}>
                          <Power size={15} aria-hidden="true" /> {feriado.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        {feriado.origen === 'personalizado' && (
                          <button type="button" className="btn ghost btn-icon danger-text" title="Eliminar fecha personalizada" onClick={() => setConfirmacion({ tipo: 'eliminar', id: feriado.id, nombre: feriado.nombre })} disabled={procesando}>
                            <Trash2 size={15} aria-hidden="true" /> Eliminar
                          </button>
                        )}
                      </>
                    )}
                    {soloLectura && <span className="config-solo-lectura">Solo lectura</span>}
                  </div>
                </td>
              </tr>
            ))}
            {(config.feriados || []).length === 0 && (
              <tr><td colSpan="6" className="config-empty">No hay feriados registrados para este año.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <FeriadoModal
          feriado={modal.feriado}
          anio={config.anio}
          procesando={procesando}
          onGuardar={guardarFeriado}
          onCancelar={() => setModal(null)}
        />
      )}

      {confirmacion?.tipo === 'eliminar' && (
        <ConfirmacionModal
          titulo="¿Eliminar esta fecha?"
          mensaje={`Se eliminará "${confirmacion.nombre}" del calendario ${config.anio}.`}
          confirmarTexto="Eliminar fecha"
          peligro
          procesando={procesando}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setConfirmacion(null)}
        />
      )}

      {confirmacion?.tipo === 'restaurar' && (
        <ConfirmacionModal
          titulo="¿Restaurar calendario oficial?"
          mensaje={`Se restaurarán los feriados oficiales de ${config.anio}. Las fechas personalizadas se conservan.`}
          confirmarTexto="Restaurar"
          peligro
          procesando={procesando}
          onConfirmar={confirmarRestaurar}
          onCancelar={() => setConfirmacion(null)}
        />
      )}

      {!soloLectura && (
        <p className="config-help"><Save size={14} aria-hidden="true" /> Cada cambio se guarda de inmediato y solicita recalcular las cuotas pendientes.</p>
      )}
      {soloLectura && (
        <p className="config-help"><X size={14} aria-hidden="true" /> El gerente puede consultar el calendario, pero solo el administrador puede modificarlo.</p>
      )}
    </section>
  );
}
