import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  abrir,
  cambiarEstado,
  cerrarCuenta,
  listarPorSocio,
} from '../../cuentas-ahorro/services/cuentas-ahorro.service';
import { depositar, retirar } from '../../transacciones/services/transacciones.service';
import { obtener } from '../services/socios.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';
import Paginacion from '../../../components/common/Paginacion.jsx';
import ConfirmacionModal from '../../../components/common/ConfirmacionModal.jsx';
import usePaginacion from '../../../hooks/usePaginacion';
import { useAuth } from '../../../context/AuthContext.jsx';

const POR_PAGINA = 10;

export default function SocioCuentasPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [socio, setSocio] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [montos, setMontos] = useState({});
  const [confirmacion, setConfirmacion] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const puedeGestionar = ['administrador', 'oficial_credito'].includes(user?.rol);
  const puedeOperar = ['administrador', 'cajero'].includes(user?.rol);
  const puedeVerCerradas = user?.rol !== 'cajero';
  const cuentasActivas = cuentas.filter((cuenta) => cuenta.estado === 'activa').length;

  async function cargar() {
    setCargando(true);
    setError('');
    try {
      const [datosSocio, datosCuentas] = await Promise.all([obtener(id), listarPorSocio(id)]);
      setSocio(datosSocio);
      setCuentas(datosCuentas);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudieron cargar las cuentas del socio.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [id]);

  const cuentasFiltradas = useMemo(
    () => cuentas
      .filter((cuenta) => {
        if (filtroEstado === 'todas') return cuenta.estado !== 'cerrada';
        if (filtroEstado === 'cerrada') return puedeVerCerradas && cuenta.estado === 'cerrada';
        return cuenta.estado === filtroEstado;
      })
      .sort((a, b) => {
        const ordenEstado = { activa: 0, inactiva: 1, cerrada: 2 };
        return ordenEstado[a.estado] - ordenEstado[b.estado];
      }),
    [cuentas, filtroEstado, puedeVerCerradas]
  );
  const paginacion = usePaginacion(cuentasFiltradas, POR_PAGINA, {
    clave: 'cuentasPagina',
    reiniciarCon: [filtroEstado],
  });

  function solicitarApertura() {
    setConfirmacion({
      tipo: 'abrirCuenta',
      titulo: '¿Abrir una cuenta de ahorro?',
      mensaje: `Se abrirá una cuenta para ${socio.nombre} ${socio.apellido} con saldo inicial de RD$ 0.00.`,
      confirmarTexto: 'Abrir cuenta',
    });
  }

  function solicitarCambioEstado(cuenta) {
    const estado = cuenta.estado === 'activa' ? 'inactiva' : 'activa';
    setConfirmacion({
      tipo: 'estadoCuenta',
      cuentaId: cuenta.id,
      estado,
      titulo: estado === 'inactiva' ? '¿Desactivar esta cuenta?' : '¿Activar esta cuenta?',
      mensaje: estado === 'inactiva'
        ? `La cuenta ${cuenta.numeroCuenta} no permitirá depósitos ni retiros mientras esté desactivada.`
        : `La cuenta ${cuenta.numeroCuenta} volverá a estar disponible para operaciones.`,
      confirmarTexto: estado === 'inactiva' ? 'Desactivar cuenta' : 'Activar cuenta',
      peligro: estado === 'inactiva',
    });
  }

  function solicitarCierre(cuenta) {
    setConfirmacion({
      tipo: 'confirmarCierreCuenta',
      cuentaId: cuenta.id,
      numeroCuenta: cuenta.numeroCuenta,
      titulo: '¿Estás seguro de que quieres cerrar esta cuenta?',
      mensaje: `La cuenta ${cuenta.numeroCuenta} dejará de estar disponible. Confirma de nuevo que entiendes que no se podrá reabrir.`,
      confirmarTexto: 'Continuar',
      peligro: true,
    });
  }

  function solicitarOperacion(cuenta, operacion) {
    const monto = Number(montos[cuenta.id]);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresa un monto mayor a cero antes de continuar.');
      return;
    }
    setError('');
    setConfirmacion({
      tipo: 'transaccion',
      cuentaId: cuenta.id,
      operacion,
      monto,
      titulo: operacion === 'deposito' ? '¿Confirmar depósito?' : '¿Confirmar retiro?',
      mensaje: `Se ${operacion === 'deposito' ? 'depositarán' : 'retirarán'} RD$ ${monto.toLocaleString()} en la cuenta ${cuenta.numeroCuenta}.`,
      confirmarTexto: operacion === 'deposito' ? 'Confirmar depósito' : 'Confirmar retiro',
    });
  }

  async function confirmarAccion() {
    if (!confirmacion) return;
    if (confirmacion.tipo === 'confirmarCierreCuenta') {
      setConfirmacion({
        ...confirmacion,
        tipo: 'cerrarCuenta',
        titulo: 'Confirmación final: cerrar cuenta',
        mensaje: `¿Confirmas definitivamente el cierre de ${confirmacion.numeroCuenta}? Esta acción es irreversible y no se podrá abrir nuevamente.`,
        confirmarTexto: 'Sí, cerrar definitivamente',
      });
      return;
    }

    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      if (confirmacion.tipo === 'abrirCuenta') {
        await abrir(id, 0);
        setMensaje('La cuenta de ahorro se abrió correctamente.');
      } else if (confirmacion.tipo === 'estadoCuenta') {
        await cambiarEstado(confirmacion.cuentaId, confirmacion.estado);
        setMensaje(`La cuenta se ${confirmacion.estado === 'activa' ? 'activó' : 'desactivó'} correctamente.`);
      } else if (confirmacion.tipo === 'cerrarCuenta') {
        await cerrarCuenta(confirmacion.cuentaId);
        setMensaje(`La cuenta ${confirmacion.numeroCuenta} se cerró correctamente.`);
      } else if (confirmacion.tipo === 'transaccion') {
        if (confirmacion.operacion === 'deposito') {
          await depositar(confirmacion.cuentaId, confirmacion.monto);
        } else {
          await retirar(confirmacion.cuentaId, confirmacion.monto);
        }
        setMontos((anteriores) => ({ ...anteriores, [confirmacion.cuentaId]: '' }));
        setMensaje(`${confirmacion.operacion === 'deposito' ? 'Depósito' : 'Retiro'} registrado correctamente.`);
      }
      setConfirmacion(null);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'No se pudo completar la operación.');
      setConfirmacion(null);
    } finally {
      setProcesando(false);
    }
  }

  if (cargando && !socio) return <p role="status">Cargando cuentas…</p>;
  if (!socio) {
    return (
      <div>
        <Link to={`/socios/${id}`}>← Volver al socio</Link>
        {error && <div className="alert error" role="alert">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <Link to={`/socios/${id}`} style={{ fontSize: '0.82rem' }}>← Volver al socio</Link>
      <div className="socio-detail-heading">
        <div>
          <h3>Cuentas de {socio.nombre} {socio.apellido}</h3>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            {cuentasActivas} cuentas activas
          </p>
        </div>
        {puedeGestionar && (
          <button
            className="btn primary"
            type="button"
            onClick={solicitarApertura}
            disabled={socio.estado !== 'activo'}
            title={socio.estado !== 'activo' ? 'Activa al socio antes de abrir una cuenta' : undefined}
          >
            Abrir cuenta de ahorro
          </button>
        )}
      </div>

      {error && <div className="alert error" role="alert">{error}</div>}
      {mensaje && <div className="alert success" role="status">{mensaje}</div>}
      {socio.estado !== 'activo' && (
        <div className="alert error">El socio está inactivo. No se pueden abrir ni operar cuentas hasta reactivarlo.</div>
      )}

      <div className="account-list-toolbar">
        <label htmlFor="filtro-cuentas">Mostrar cuentas</label>
        <select id="filtro-cuentas" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todas">Cuentas abiertas</option>
          <option value="activa">Activas</option>
          <option value="inactiva">Desactivadas</option>
          {puedeVerCerradas && <option value="cerrada">Cerradas</option>}
        </select>
      </div>

      <div className="account-list">
        {paginacion.visibles.map((cuenta) => {
          const activa = cuenta.estado === 'activa';
          const cerrada = cuenta.estado === 'cerrada';
          const puedeHacerOperacion = puedeOperar && activa && socio.estado === 'activo';

          return (
            <article key={cuenta.id} className="card account-card">
              <div className="account-card-heading">
                <div>
                  <div className="mono account-number">{cuenta.numeroCuenta}</div>
                  <div className="account-meta">
                    Apertura: {new Date(`${cuenta.fechaApertura}T00:00:00`).toLocaleDateString()}
                  </div>
                </div>
                <div className="account-balance">
                  <span>Saldo actual</span>
                  <strong className="mono">RD$ {Number(cuenta.saldo).toLocaleString()}</strong>
                </div>
                <EstadoTag estado={cuenta.estado} />
              </div>

              <div className="account-card-actions">
                {puedeHacerOperacion && (
                  <div className="account-operation-actions">
                    <label className="visually-hidden" htmlFor={`monto-${cuenta.id}`}>Monto de la operación</label>
                    <input
                      id={`monto-${cuenta.id}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Monto"
                      value={montos[cuenta.id] || ''}
                      onChange={(e) => setMontos({ ...montos, [cuenta.id]: e.target.value })}
                    />
                    <button className="btn primary" type="button" onClick={() => solicitarOperacion(cuenta, 'deposito')}>Depositar</button>
                    <button className="btn secondary" type="button" onClick={() => solicitarOperacion(cuenta, 'retiro')}>Retirar</button>
                  </div>
                )}
                {puedeGestionar && !cerrada && (
                  <div className="account-management-actions">
                    {cuenta.estado === 'inactiva' && socio.estado === 'activo' && (
                      <button className="btn secondary" type="button" onClick={() => solicitarCambioEstado(cuenta)}>
                        Activar cuenta
                      </button>
                    )}
                    {cuenta.estado === 'inactiva' ? (
                      <button className="btn danger" type="button" onClick={() => solicitarCierre(cuenta)}>
                        Cerrar cuenta
                      </button>
                    ) : socio.estado === 'activo' && (
                      <button className="btn danger" type="button" onClick={() => solicitarCambioEstado(cuenta)}>
                        Desactivar cuenta
                      </button>
                    )}
                  </div>
                )}
              </div>
              {cerrada && <p className="account-meta">Las cuentas cerradas no se pueden reactivar.</p>}
            </article>
          );
        })}
        {paginacion.visibles.length === 0 && (
          <p style={{ color: 'var(--ink-soft)' }}>
            {cuentasFiltradas.length === 0
              ? filtroEstado === 'todas'
                ? 'Este socio aún no tiene cuentas activas o desactivadas.'
                : 'No hay cuentas en este apartado.'
              : 'No hay cuentas que coincidan con el filtro.'}
          </p>
        )}
      </div>

      <Paginacion
        paginaActual={paginacion.paginaActual}
        totalPaginas={paginacion.totalPaginas}
        onCambiar={paginacion.setPagina}
        desde={paginacion.desde}
        hasta={paginacion.hasta}
        total={paginacion.total}
      />

      {confirmacion && (
        <ConfirmacionModal
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          confirmarTexto={confirmacion.confirmarTexto}
          peligro={confirmacion.peligro}
          procesando={procesando}
          onConfirmar={confirmarAccion}
          onCancelar={() => { if (!procesando) setConfirmacion(null); }}
        />
      )}
    </div>
  );
}
