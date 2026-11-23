import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Settings2, TriangleAlert } from 'lucide-react';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import * as configuracion from '../services/configuracion.service';
import DiasLaborablesSection from '../components/DiasLaborablesSection.jsx';
import FeriadosSection from '../components/FeriadosSection.jsx';
import MoraSection from '../components/MoraSection.jsx';

const PESTANAS = [
  { id: 'feriados', etiqueta: 'Feriados' },
  { id: 'dias', etiqueta: 'Días laborables' },
  { id: 'mora', etiqueta: 'Mora' },
];

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const rol = user?.rol;
  const puedeEditarCalendario = rol === 'administrador';
  const puedeEditarMora = rol === 'administrador' || rol === 'gerente';

  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [config, setConfig] = useState(null);
  const [pestana, setPestana] = useState('feriados');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [preview, setPreview] = useState(null);
  const [modalRecalculo, setModalRecalculo] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  async function cargar(anioDestino = anio) {
    setCargando(true);
    setError('');
    try {
      const datos = await configuracion.obtener(anioDestino);
      setConfig(datos);
      return datos;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo cargar la configuración');
      return null;
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(anio);
  }, [anio]);

  async function trasCambioCalendario() {
    await cargar();
    setAviso('Calendario guardado correctamente.');
    try {
      const resultado = await configuracion.previsualizarRecalculo();
      setPreview(resultado);
      if (resultado.cuotasAfectadas > 0) setModalRecalculo(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo previsualizar el recálculo');
    }
  }

  async function confirmarRecalculo() {
    setRecalculando(true);
    setError('');
    try {
      const resultado = await configuracion.recalcularCuotas();
      setModalRecalculo(false);
      setPreview(null);
      setAviso(`Se recalcularon ${resultado.cuotasAfectadas} cuota(s) de ${resultado.prestamosAfectados} préstamo(s).`);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo recalcular las cuotas');
    } finally {
      setRecalculando(false);
    }
  }

  function cambiarAnio(delta) {
    setAnio((prev) => Math.min(2100, Math.max(2000, prev + delta)));
    setAviso('');
  }

  if (cargando && !config) {
    return <div className="config-page"><p className="config-empty">Cargando configuración…</p></div>;
  }

  return (
    <div className="config-page">
      <div className="config-page-header">
        <div>
          <h2><Settings2 size={24} aria-hidden="true" /> Configuración</h2>
          <p>Calendario laboral, feriados y tasa de mora de la cooperativa.</p>
        </div>
        <div className="config-anio" aria-label="Año del calendario">
          <button type="button" className="btn ghost btn-icon" onClick={() => cambiarAnio(-1)} aria-label="Año anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <strong>{anio}</strong>
          <button type="button" className="btn ghost btn-icon" onClick={() => cambiarAnio(1)} aria-label="Año siguiente">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {aviso && !modalRecalculo && <div className="alert success" role="status">{aviso}</div>}

      {config?.calendarioDesactualizado && !modalRecalculo && (
        <div className="config-banner" role="status">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>Hay cambios de calendario sin aplicar a las cuotas pendientes.</span>
          <button type="button" className="btn secondary" onClick={async () => {
            const resultado = await configuracion.previsualizarRecalculo();
            setPreview(resultado);
            setModalRecalculo(true);
          }}>
            <RefreshCw size={15} aria-hidden="true" /> Recalcular ahora
          </button>
        </div>
      )}

      <div className="config-tabs" role="tablist" aria-label="Secciones de configuración">
        {PESTANAS.map((pestanaItem) => (
          <button
            key={pestanaItem.id}
            type="button"
            role="tab"
            aria-selected={pestana === pestanaItem.id}
            className={`config-tab${pestana === pestanaItem.id ? ' is-active' : ''}`}
            onClick={() => setPestana(pestanaItem.id)}
          >
            {pestanaItem.etiqueta}
          </button>
        ))}
      </div>

      {config && (
        <div className="card config-card">
          {pestana === 'feriados' && (
            <FeriadosSection
              config={config}
              soloLectura={!puedeEditarCalendario}
              onCambio={trasCambioCalendario}
              onError={setError}
            />
          )}
          {pestana === 'dias' && (
            <DiasLaborablesSection
              config={config}
              soloLectura={!puedeEditarCalendario}
              onCambio={trasCambioCalendario}
              onError={setError}
            />
          )}
          {pestana === 'mora' && (
            <MoraSection
              config={config}
              puedeEditar={puedeEditarMora}
              onCambio={async () => { await cargar(); setAviso('Tasa de mora actualizada.'); }}
              onError={setError}
            />
          )}
        </div>
      )}

      {modalRecalculo && (
        <ConfirmacionModal
          titulo="¿Recalcular fechas de vencimiento?"
          mensaje={
            preview?.cuotasAfectadas > 0
              ? `Se moverán ${preview.cuotasAfectadas} cuota(s) de ${preview.prestamosAfectados} préstamo(s). Las cuotas pagadas o vencidas no se modifican.`
              : 'No hay cuotas pendientes que cambien con el nuevo calendario. ¿Deseas marcar el calendario como aplicado?'
          }
          confirmarTexto="Recalcular ahora"
          cancelarTexto="Más tarde"
          procesando={recalculando}
          onConfirmar={confirmarRecalculo}
          onCancelar={() => { setModalRecalculo(false); setAviso('Puedes recalcular más tarde desde el banner superior.'); }}
        />
      )}
    </div>
  );
}
