import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ClipboardList,
  HandCoins,
  Search,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../../context/AuthContext.jsx';
import { listar as listarAuditoria } from '../../auditoria/services/auditoria.service';
import { listar as listarUsuarios } from '../../usuarios-roles/services/usuarios-roles.service';
import { listar as listarPrestamos } from '../../prestamos/services/prestamos.service';
import { listarTickets } from '../../../services/tickets.service';
import { resumen, prestamosPorEstado as listarPrestamosPorEstado } from '../services/reportes.service';
import ResumenMes from '../components/ResumenMes.jsx';
import PrestadoVsIngresos from '../components/PrestadoVsIngresos.jsx';
import CuentasAbiertasCerradas from '../components/CuentasAbiertasCerradas.jsx';
import PrestamosPorTipo from '../components/PrestamosPorTipo.jsx';
import KpiCard from '../components/KpiCard.jsx';
import PanelCard from '../components/PanelCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ChartSkeleton from '../components/ChartSkeleton.jsx';
import AtencionCard from '../components/AtencionCard.jsx';
import { COLORES_GRAFICOS } from '../../../utils/coloresGraficos.js';
import TotalSocios from '../components/TotalSocios.jsx';
import BotonDescarga from '../components/BotonDescarga.jsx';

const ETIQUETAS_ROL = {
  administrador: 'Administrador',
  cajero: 'Cajero',
  oficial_credito: 'Oficial de Crédito',
  gerente: 'Gerente',
  auditor: 'Auditor',
};

const DESCRIPCIONES_ROL = {
  administrador: 'Control general de usuarios, operaciones y actividad de la cooperativa.',
  cajero: 'Accesos rápidos y cifras útiles para la atención diaria en caja.',
  oficial_credito: 'Seguimiento de solicitudes, evaluación y cartera de crédito.',
  gerente: 'Solicitudes evaluadas que requieren decisión y seguimiento de cartera.',
  auditor: 'Actividad reciente y reportes para supervisar las operaciones.',
};

const ETIQUETAS_ESTADO_PRESTAMO = {
  solicitado: 'Solicitado',
  evaluado: 'Evaluación',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  desembolsado: 'Desembolsado',
  cerrado: 'Cerrado',
};

const ETIQUETAS_ACCION = {
  deposito: 'Depósito',
  retiro: 'Retiro',
  registrar_pago: 'Pago registrado',
  solicitar_prestamo: 'Solicitud de préstamo',
  eliminar_solicitud_prestamo: 'Solicitud de préstamo eliminada',
  crear_usuario: 'Usuario creado',
  actualizar_usuario: 'Usuario actualizado',
  cambiar_estado_usuario: 'Estado de usuario cambiado',
  crear_socio: 'Socio creado',
  actualizar_socio: 'Socio actualizado',
  crear_ticket: 'Ticket creado',
  actualizar_ticket: 'Estado del ticket actualizado',
  eliminar_ticket: 'Ticket eliminado',
};

const ESTADOS_TICKET = [
  { estado: 'pending', etiqueta: 'Pendientes', color: COLORES_GRAFICOS.advertencia },
  { estado: 'resolved', etiqueta: 'Resueltos', color: COLORES_GRAFICOS.principal },
  { estado: 'cancelled', etiqueta: 'Cancelados', color: COLORES_GRAFICOS.negativo },
];

const REPORTES_POR_ROL = {
  gerente: ['socios', 'mes', 'cuentas', 'prestado', 'tipo'],
  auditor: ['socios', 'mes', 'cuentas', 'prestado', 'tipo', 'auditoria'],
  administrador: ['socios', 'cuentas', 'tipo', 'auditoria'],
};

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function mensajeError(error, fallback) {
  return error?.response?.data?.error?.message || fallback;
}

function formatoNumero(valor) {
  return Number(valor || 0).toLocaleString('es-DO');
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function etiquetaAccion(accion) {
  return ETIQUETAS_ACCION[accion] || String(accion || 'otra').replace(/_/g, ' ');
}

function ErrorSeccion({ error }) {
  return error ? <EmptyState error>{error}</EmptyState> : null;
}

function GraficoBarras({
  datos,
  descripcion,
  color = COLORES_GRAFICOS.principal,
  anchoEtiqueta = 150,
  mensajeVacio = 'No hay datos para mostrar todavía.',
  cargando = false,
}) {
  if (cargando) return <ChartSkeleton />;

  const filas = datos.filter((fila) => Number(fila.cantidad) > 0);
  if (!filas.length) return <EmptyState>{mensajeVacio}</EmptyState>;

  if (filas.length < 3) {
    return (
      <ul className="dashboard-compact-values" aria-label={descripcion}>
        {filas.map((fila) => (
          <li key={fila.etiqueta}>
            <span>{fila.etiqueta}</span>
            <strong>{formatoNumero(fila.cantidad)}</strong>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="dashboard-chart" role="img" aria-label={descripcion}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filas}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
        >
          <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="etiqueta"
            width={anchoEtiqueta}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(valor) => [formatoNumero(valor), 'Cantidad']} />
          <Bar dataKey="cantidad" fill={color} radius={[0, 5, 5, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GraficoTendencia({ datos, descripcion, mensajeVacio, cargando = false }) {
  if (cargando) return <ChartSkeleton />;

  const puntosConDatos = datos.filter((fila) => Number(fila.cantidad) > 0);
  if (!puntosConDatos.length) {
    return <EmptyState>{mensajeVacio || 'No hay actividad para el periodo seleccionado.'}</EmptyState>;
  }

  if (puntosConDatos.length < 3) {
    return (
      <ul className="dashboard-compact-values" aria-label={descripcion}>
        {puntosConDatos.map((fila) => (
          <li key={fila.etiqueta}>
            <span>{fila.etiqueta}</span>
            <strong>{formatoNumero(fila.cantidad)}</strong>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="dashboard-chart" role="img" aria-label={descripcion}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip formatter={(valor) => [formatoNumero(valor), 'Cantidad']} />
          <Area
            type="monotone"
            dataKey="cantidad"
            stroke={COLORES_GRAFICOS.principal}
            fill={COLORES_GRAFICOS.positivo}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function GraficoTickets({ datos, cargando }) {
  if (cargando) return <ChartSkeleton />;
  const conActividad = datos.filter((item) => item.cantidad > 0);

  if (conActividad.length < 3) {
    if (!conActividad.length) return <EmptyState>No hay tickets registrados todavía.</EmptyState>;
    return (
      <ul className="dashboard-compact-values" aria-label="Tickets por estado">
        {conActividad.map((item) => (
          <li key={item.estado}>
            <span>{item.etiqueta}</span>
            <strong>{formatoNumero(item.cantidad)}</strong>
          </li>
        ))}
      </ul>
    );
  }

  const apilados = Object.fromEntries(datos.map((item) => [item.estado, item.cantidad]));
  return (
    <div className="dashboard-chart dashboard-chart-short" role="img" aria-label="Tickets por estado en una barra apilada">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[{ etiqueta: 'Tickets', ...apilados }]} layout="vertical" margin={{ top: 12, right: 12, left: 0, bottom: 12 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="etiqueta" hide />
          <Tooltip formatter={(valor) => [formatoNumero(valor), 'Tickets']} />
          <Legend itemSorter={null} />
          {datos.map((item) => (
            <Bar
              key={item.estado}
              dataKey={item.estado}
              name={item.etiqueta}
              stackId="tickets"
              fill={item.color}
              radius={item.estado === conActividad[conActividad.length - 1].estado ? [0, 5, 5, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ListaCompacta({ datos, ariaLabel }) {
  const filas = datos.filter((fila) => fila.cantidad > 0);
  if (!filas.length) return <EmptyState>No hay datos para mostrar todavía.</EmptyState>;
  return (
    <ul className="dashboard-compact-values" aria-label={ariaLabel}>
      {filas.map((fila) => (
        <li key={fila.etiqueta}>
          <span>{fila.etiqueta}</span>
          <strong>{formatoNumero(fila.cantidad)}</strong>
        </li>
      ))}
    </ul>
  );
}

function PanelAdministrador({ data, errors, cargando }) {
  const usuarios = data.usuarios || [];
  const auditoria = data.auditoria || [];
  const tickets = data.tickets || [];
  const prestamos = data.prestamos || [];
  const ticketsPendientes = tickets.filter((ticket) => ticket.estado === 'pending').length;
  const aprobadosPorDesembolsar = prestamos.filter((prestamo) => prestamo.estado === 'aprobado').length;
  const usuariosActivos = usuarios.filter((usuario) => usuario.activo === true).length;

  const usuariosPorRol = useMemo(() => {
    const conteo = new Map();
    usuarios.forEach((usuario) => conteo.set(usuario.rol, (conteo.get(usuario.rol) || 0) + 1));
    return Object.entries(ETIQUETAS_ROL)
      .map(([rol, etiqueta]) => ({ rol, etiqueta, cantidad: conteo.get(rol) || 0 }))
      .filter((fila) => fila.cantidad > 0);
  }, [usuarios]);

  const actividadPorTipo = useMemo(() => {
    const conteo = new Map();
    auditoria.forEach((evento) => {
      const accion = evento.accion || 'otra';
      conteo.set(accion, (conteo.get(accion) || 0) + 1);
    });
    return Array.from(conteo, ([accion, cantidad]) => ({ etiqueta: etiquetaAccion(accion), cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'))
      .slice(0, 5);
  }, [auditoria]);

  const ticketsPorEstado = ESTADOS_TICKET.map(({ estado, etiqueta, color }) => ({
    estado,
    etiqueta,
    color,
    cantidad: tickets.filter((ticket) => ticket.estado === estado).length,
  }));
  const prestamosPorEstado = (data.prestamosEstado || []).map((fila) => ({
    etiqueta: ETIQUETAS_ESTADO_PRESTAMO[fila.estado] || fila.estado,
    cantidad: Number(fila.total),
  }));
  const resumen = data.resumen;

  return (
    <>
      <section className="dashboard-attention" aria-labelledby="dashboard-attention-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="dashboard-attention-title">Requiere atención</h2>
            <p>Alertas que pueden requerir una acción hoy.</p>
          </div>
        </div>
        {cargando ? (
          <div className="dashboard-attention-loading" aria-label="Cargando alertas">
            <span className="dashboard-skeleton" />
            <span className="dashboard-skeleton" />
            <span className="dashboard-skeleton" />
          </div>
        ) : errors.tickets || errors.resumen || errors.prestamos ? (
          <ErrorSeccion error={errors.tickets || errors.resumen || errors.prestamos} />
        ) : (
          <div className="dashboard-attention-grid">
            {ticketsPendientes > 0 && <AtencionCard href="/tickets?estado=pending" etiqueta="Tickets pendientes" cantidad={ticketsPendientes} />}
            {Number(resumen?.cuotasEnMora) > 0 && <AtencionCard href="/pagos" etiqueta="Cuotas en mora" cantidad={formatoNumero(resumen.cuotasEnMora)} />}
            {aprobadosPorDesembolsar > 0 && <AtencionCard href="/prestamos?estado=aprobado" etiqueta="Aprobados por desembolsar" cantidad={aprobadosPorDesembolsar} />}
            {!ticketsPendientes && !Number(resumen?.cuotasEnMora) && !aprobadosPorDesembolsar && (
              <EmptyState>Todo al día.</EmptyState>
            )}
          </div>
        )}
      </section>

      <section className="dashboard-kpi-grid" aria-label="Cifras clave de administración">
        <KpiCard
          etiqueta="Ahorros administrados"
          valor={errors.resumen ? '—' : formatoMoneda(resumen?.totalAhorros)}
          href="/socios?estado=activo"
          destacado
          cargando={cargando}
        />
        <KpiCard
          etiqueta="Socios activos"
          valor={errors.resumen ? '—' : formatoNumero(resumen?.totalSocios)}
          detalle={errors.resumen ? 'No se pudo cargar' : `${formatoNumero(resumen?.sociosInactivos)} inactivos`}
          href="/socios?estado=activo"
          cargando={cargando}
        />
        <KpiCard
          etiqueta="Préstamos vigentes"
          valor={errors.resumen ? '—' : formatoNumero(resumen?.prestamosVigentes)}
          href="/prestamos?estado=desembolsado"
          cargando={cargando}
        />
        <KpiCard
          etiqueta="Usuarios activos"
          valor={errors.usuarios ? '—' : formatoNumero(usuariosActivos)}
          href="/usuarios?estado=activo"
          cargando={cargando}
        />
      </section>

      <div className="dashboard-chart-grid dashboard-admin-main">
        <PrestadoVsIngresos />
        <PanelCard
          titulo="Préstamos por estado"
          descripcion="Distribución de solicitudes y cartera."
          enlace="/prestamos"
          textoEnlace="Ver préstamos"
        >
          <ErrorSeccion error={errors.prestamosEstado} />
          {!errors.prestamosEstado && (
            <GraficoBarras
              datos={prestamosPorEstado}
              descripcion="Cantidad de préstamos por estado"
              cargando={cargando}
            />
          )}
        </PanelCard>
      </div>

      <div className="dashboard-secondary-grid">
        <PanelCard titulo="Tickets por estado" enlace="/tickets?estado=pending" textoEnlace="Ver pendientes">
          <ErrorSeccion error={errors.tickets} />
          {!errors.tickets && <GraficoTickets datos={ticketsPorEstado} cargando={cargando} />}
        </PanelCard>
        <PanelCard
          titulo="Usuarios por rol"
          enlace="/usuarios"
          textoEnlace="Administrar usuarios"
        >
          <ErrorSeccion error={errors.usuarios} />
          {!errors.usuarios && (
            <GraficoBarras
              datos={usuariosPorRol}
              descripcion="Usuarios activos agrupados por rol"
              anchoEtiqueta={138}
              cargando={cargando}
            />
          )}
        </PanelCard>
        <PanelCard
          titulo="Actividad reciente"
          descripcion="Tipos de acción más frecuentes en los registros recientes."
          enlace="/auditoria"
          textoEnlace="Ver auditoría"
        >
          <ErrorSeccion error={errors.auditoria} />
          {!errors.auditoria && (
            <GraficoBarras
              datos={actividadPorTipo}
              descripcion="Cinco tipos de actividad más frecuentes"
              cargando={cargando}
            />
          )}
        </PanelCard>
      </div>
    </>
  );
}

function fechaCorta(valor) {
  if (!valor) return 'Fecha no disponible';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.valueOf())
    ? 'Fecha no disponible'
    : fecha.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PanelPrestamosRevision({ prestamos, error, cargando }) {
  const pendientes = prestamos
    .filter((prestamo) => prestamo.estado === 'evaluado')
    .slice(0, 5);

  return (
    <PanelCard
      titulo="Préstamos para revisión"
      descripcion="Solicitudes evaluadas que esperan decisión de gerencia."
      enlace="/prestamos?estado=evaluado"
      textoEnlace="Ver pendientes"
    >
      <ErrorSeccion error={error} />
      {cargando && !error && <ChartSkeleton />}
      {!cargando && !error && (pendientes.length ? (
        <ul className="dashboard-review-list">
          {pendientes.map((prestamo) => (
            <li key={prestamo.id}>
              <span>
                <strong>
                  {[prestamo.socio?.nombre, prestamo.socio?.apellido].filter(Boolean).join(' ') || 'Socio no disponible'}
                </strong>
                <small>
                  {formatoMoneda(prestamo.montoSolicitado)} · {fechaCorta(prestamo.fechaSolicitud)}
                </small>
              </span>
              <Link className="dashboard-text-link" to={`/prestamos/${prestamo.id}`}>
                Revisar <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No hay préstamos pendientes de decisión.</EmptyState>
      ))}
    </PanelCard>
  );
}

function mesesSolicitud(prestamos) {
  const hoy = new Date();
  const meses = Array.from({ length: 6 }, (_, index) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + index, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    return {
      clave,
      etiqueta: `${MESES_CORTO[fecha.getMonth()]} ${String(fecha.getFullYear()).slice(-2)}`,
      cantidad: 0,
    };
  });
  const porMes = new Map(meses.map((mes) => [mes.clave, mes]));

  prestamos.forEach((prestamo) => {
    const fecha = new Date(prestamo.fechaSolicitud);
    if (Number.isNaN(fecha.valueOf())) return;
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const mes = porMes.get(clave);
    if (mes) mes.cantidad += 1;
  });

  return meses.map(({ etiqueta, cantidad }) => ({ etiqueta, cantidad }));
}

function actividadAuditoriaPorFecha(eventos) {
  const hoy = new Date();
  const dias = Array.from({ length: 7 }, (_, index) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6 + index);
    const clave = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0'),
    ].join('-');
    return {
      clave,
      etiqueta: fecha.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }),
      cantidad: 0,
    };
  });
  const porFecha = new Map(dias.map((dia) => [dia.clave, dia]));

  eventos.forEach((evento) => {
    const fecha = new Date(evento.fecha);
    if (Number.isNaN(fecha.valueOf())) return;
    const clave = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0'),
    ].join('-');
    const dia = porFecha.get(clave);
    if (dia) dia.cantidad += 1;
  });

  return dias.map(({ etiqueta, cantidad }) => ({ etiqueta, cantidad }));
}

function PipelinePrestamos({ prestamos }) {
  const etapas = [
    { estado: 'solicitado', etiqueta: 'Solicitud' },
    { estado: 'evaluado', etiqueta: 'Evaluación' },
    { estado: 'aprobado', etiqueta: 'Aprobación' },
    { estado: 'desembolsado', etiqueta: 'Desembolso' },
    { estado: 'rechazado', etiqueta: 'Rechazado' },
  ];
  return (
    <ol className="dashboard-pipeline" aria-label="Etapas del pipeline de préstamos">
      {etapas.map((etapa, index) => (
        <li key={etapa.estado}>
          <span className="dashboard-pipeline-index">{index + 1}</span>
          <span>{etapa.etiqueta}</span>
          <strong>{formatoNumero(prestamos.filter((prestamo) => prestamo.estado === etapa.estado).length)}</strong>
        </li>
      ))}
    </ol>
  );
}

function PanelOficialCredito({ data, errors, cargando }) {
  const prestamos = data.prestamos || [];
  const porEvaluar = prestamos.filter((prestamo) => prestamo.estado === 'solicitado').length;
  const evaluados = prestamos.filter((prestamo) => prestamo.estado === 'evaluado').length;
  const porDesembolsar = prestamos.filter((prestamo) => prestamo.estado === 'aprobado').length;
  const solicitudesPorMes = useMemo(() => mesesSolicitud(prestamos), [prestamos]);

  return (
    <>
      <section className="dashboard-kpi-grid dashboard-kpi-grid-three" aria-label="Indicadores de crédito">
        <KpiCard etiqueta="Por evaluar" valor={errors.prestamos ? '—' : formatoNumero(porEvaluar)} href="/prestamos?estado=solicitado" destacado cargando={cargando} />
        <KpiCard etiqueta="Evaluados para decisión" valor={errors.prestamos ? '—' : formatoNumero(evaluados)} href="/prestamos?estado=evaluado" cargando={cargando} />
        <KpiCard etiqueta="Aprobados por desembolsar" valor={errors.prestamos ? '—' : formatoNumero(porDesembolsar)} href="/prestamos?estado=aprobado" cargando={cargando} />
      </section>
      <div className="dashboard-chart-grid dashboard-official-grid">
        <PanelCard titulo="Pipeline de préstamos" descripcion="Solicitudes según su etapa actual." enlace="/prestamos" textoEnlace="Ver préstamos">
          <ErrorSeccion error={errors.prestamos} />
          {!errors.prestamos && (
            cargando ? <ChartSkeleton /> : <PipelinePrestamos prestamos={prestamos} />
          )}
        </PanelCard>
        <PanelCard titulo="Solicitudes en el tiempo" descripcion="Solicitudes recibidas durante los últimos seis meses.">
          <ErrorSeccion error={errors.prestamos} />
          {!errors.prestamos && (
            <GraficoTendencia
              datos={solicitudesPorMes}
              descripcion="Evolución mensual de las solicitudes de préstamo"
              mensajeVacio="No hay solicitudes en los últimos seis meses."
              cargando={cargando}
            />
          )}
        </PanelCard>
      </div>
    </>
  );
}

function PanelCajero({ data, errors, cargando }) {
  const prestamos = data.prestamos || [];
  const porDesembolsar = prestamos.filter((prestamo) => prestamo.estado === 'aprobado').length;
  const estadosPrestamo = Object.entries(ETIQUETAS_ESTADO_PRESTAMO).map(([estado, etiqueta]) => ({
    etiqueta,
    cantidad: prestamos.filter((prestamo) => prestamo.estado === estado).length,
  }));

  return (
    <>
      <PanelCard titulo="Accesos rápidos" descripcion="Tareas frecuentes de atención en caja.">
        <div className="dashboard-quick-links">
          <Link to="/pagos" className="dashboard-quick-link">
            <HandCoins size={22} aria-hidden="true" />
            <span><strong>Registrar o consultar pagos</strong><small>Gestionar cuotas y abonos de préstamos</small></span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/socios" className="dashboard-quick-link">
            <Search size={22} aria-hidden="true" />
            <span><strong>Buscar un socio</strong><small>Consultar sus datos y cuentas</small></span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/prestamos" className="dashboard-quick-link">
            <ClipboardList size={22} aria-hidden="true" />
            <span><strong>Consultar préstamos</strong><small>Revisar el estado de las solicitudes</small></span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </PanelCard>
      <section className="dashboard-kpi-grid dashboard-kpi-grid-two" aria-label="Indicadores de caja">
        <KpiCard
          etiqueta="Cuotas en mora"
          valor={errors.resumen ? '—' : formatoNumero(data.resumen?.cuotasEnMora)}
          href="/pagos"
          destacado={Number(data.resumen?.cuotasEnMora) > 0}
          alerta={Number(data.resumen?.cuotasEnMora) > 0}
          cargando={cargando}
        />
        <KpiCard
          etiqueta="Aprobados por desembolsar"
          valor={errors.prestamos ? '—' : formatoNumero(porDesembolsar)}
          href="/prestamos?estado=aprobado"
          cargando={cargando}
        />
      </section>
      {errors.prestamos && <EmptyState error>{errors.prestamos}</EmptyState>}
      {!errors.prestamos && estadosPrestamo.filter((fila) => fila.cantidad > 0).length >= 3 && (
        <PanelCard titulo="Préstamos por estado" enlace="/prestamos" textoEnlace="Ver préstamos">
          <GraficoBarras
            datos={estadosPrestamo}
            descripcion="Préstamos agrupados por estado"
            cargando={cargando}
          />
        </PanelCard>
      )}
    </>
  );
}

function PanelGerente({ data, errors, cargando }) {
  const prestamos = data.prestamos || [];
  const pendientesDecision = prestamos.filter((prestamo) => prestamo.estado === 'evaluado').length;
  const aprobados = prestamos.filter((prestamo) => prestamo.estado === 'aprobado').length;
  const prestamosPorEstado = (data.prestamosEstado || []).map((fila) => ({
    etiqueta: ETIQUETAS_ESTADO_PRESTAMO[fila.estado] || fila.estado,
    cantidad: Number(fila.total),
  }));

  return (
    <>
      <section className="dashboard-kpi-grid" aria-label="Indicadores de gerencia">
        <KpiCard etiqueta="Pendientes de decisión" valor={errors.prestamos ? '—' : formatoNumero(pendientesDecision)} detalle="Solicitudes ya evaluadas" href="/prestamos?estado=evaluado" destacado alerta={pendientesDecision > 0} cargando={cargando} />
        <KpiCard etiqueta="Aprobados por desembolsar" valor={errors.prestamos ? '—' : formatoNumero(aprobados)} href="/prestamos?estado=aprobado" cargando={cargando} />
        <KpiCard etiqueta="Cuotas en mora" valor={errors.resumen ? '—' : formatoNumero(data.resumen?.cuotasEnMora)} href="/pagos" alerta={Number(data.resumen?.cuotasEnMora) > 0} cargando={cargando} />
        <KpiCard etiqueta="Préstamos vigentes" valor={errors.resumen ? '—' : formatoNumero(data.resumen?.prestamosVigentes)} href="/prestamos?estado=desembolsado" cargando={cargando} />
      </section>
      <div className="dashboard-chart-grid dashboard-manager-grid">
        <PanelPrestamosRevision prestamos={prestamos} error={errors.prestamos} cargando={cargando} />
        <PanelCard titulo="Préstamos por estado" descripcion="Distribución de solicitudes y cartera." enlace="/prestamos" textoEnlace="Ver préstamos">
          <ErrorSeccion error={errors.prestamosEstado} />
          {!errors.prestamosEstado && (
            <GraficoBarras datos={prestamosPorEstado} descripcion="Cantidad de préstamos por estado" cargando={cargando} />
          )}
        </PanelCard>
      </div>
    </>
  );
}

function ActividadAuditoria({ eventos, error, cargando, mostrarEnlace = true }) {
  const fechaGraficaRef = useRef(null);
  const tipoGraficaRef = useRef(null);
  const rolGraficaRef = useRef(null);
  const actividades = useMemo(() => {
    const conteo = new Map();
    eventos.forEach((evento) => {
      const accion = evento.accion || 'otra';
      conteo.set(accion, (conteo.get(accion) || 0) + 1);
    });
    return Array.from(conteo, ([accion, cantidad]) => ({ etiqueta: etiquetaAccion(accion), cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'))
      .slice(0, 5);
  }, [eventos]);
  const actividadPorRol = useMemo(() => {
    const conteo = new Map();
    eventos.forEach((evento) => {
      const rol = evento.usuario?.rol;
      if (rol) conteo.set(rol, (conteo.get(rol) || 0) + 1);
    });
    return Array.from(conteo, ([rol, cantidad]) => ({
      etiqueta: ETIQUETAS_ROL[rol] || rol,
      cantidad,
    })).sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'));
  }, [eventos]);
  const actividadPorFecha = useMemo(() => actividadAuditoriaPorFecha(eventos), [eventos]);

  return (
    <div className="dashboard-chart-grid dashboard-auditor-grid">
      <PanelCard
        titulo="Actividad por fecha"
        descripcion="Acciones registradas en cada uno de los últimos siete días."
        enlace={mostrarEnlace ? '/auditoria' : undefined}
        textoEnlace={mostrarEnlace ? 'Revisar bitácora' : undefined}
        actions={(
          <BotonDescarga
            archivo="actividad-bitacora-por-fecha"
            titulo="Actividad de bitácora por fecha"
            periodo="Últimos 7 días"
            columnas={[
              { header: 'Fecha', key: 'etiqueta' },
              { header: 'Acciones', key: 'cantidad' },
            ]}
            filas={cargando || error ? [] : actividadPorFecha}
            grafica={fechaGraficaRef}
          />
        )}
      >
        <ErrorSeccion error={error} />
        {!error && (
          <div ref={fechaGraficaRef}>
            <GraficoTendencia
              datos={actividadPorFecha}
              descripcion="Cantidad de eventos de auditoría por fecha durante los últimos siete días"
              cargando={cargando}
            />
          </div>
        )}
      </PanelCard>
      <PanelCard
        titulo="Actividad por tipo"
        descripcion="Cinco tipos de acción más frecuentes."
        enlace={mostrarEnlace ? '/auditoria' : undefined}
        textoEnlace={mostrarEnlace ? 'Revisar bitácora' : undefined}
        actions={(
          <BotonDescarga
            archivo="actividad-bitacora-por-tipo"
            titulo="Actividad de bitácora por tipo"
            periodo="Hasta 200 registros recientes"
            columnas={[
              { header: 'Tipo de actividad', key: 'etiqueta' },
              { header: 'Acciones', key: 'cantidad' },
            ]}
            filas={cargando || error ? [] : actividades}
            grafica={tipoGraficaRef}
          />
        )}
      >
        <ErrorSeccion error={error} />
        {!error && (
          <div ref={tipoGraficaRef}>
            <GraficoBarras datos={actividades} descripcion="Acciones recientes de auditoría por tipo" cargando={cargando} />
          </div>
        )}
      </PanelCard>
      <PanelCard
        titulo="Actividad por rol"
        descripcion="Eventos atribuidos a cada perfil."
        enlace={mostrarEnlace ? '/auditoria' : undefined}
        textoEnlace={mostrarEnlace ? 'Revisar bitácora' : undefined}
        actions={(
          <BotonDescarga
            archivo="actividad-bitacora-por-rol"
            titulo="Actividad de bitácora por rol"
            periodo="Hasta 200 registros recientes"
            columnas={[
              { header: 'Rol', key: 'etiqueta' },
              { header: 'Acciones', key: 'cantidad' },
            ]}
            filas={cargando || error ? [] : actividadPorRol}
            grafica={rolGraficaRef}
          />
        )}
      >
        <ErrorSeccion error={error} />
        {!error && (
          <div ref={rolGraficaRef}>
            <ListaCompacta datos={actividadPorRol} ariaLabel="Actividad por rol de usuario" />
          </div>
        )}
      </PanelCard>
    </div>
  );
}

function PanelAuditor({ data, errors, cargando }) {
  const eventos = data.auditoria || [];
  const usuariosConActividad = new Set(eventos.map((evento) => evento.usuarioId).filter(Boolean)).size;
  const tiposActividad = new Set(eventos.map((evento) => evento.accion || 'otra')).size;

  return (
    <>
      <section className="dashboard-kpi-grid dashboard-kpi-grid-three" aria-label="Indicadores de auditoría">
        <KpiCard etiqueta="Acciones recientes" valor={errors.auditoria ? '—' : formatoNumero(eventos.length)} detalle="Hasta 200 registros recientes" href="/auditoria" destacado cargando={cargando} />
        <KpiCard etiqueta="Usuarios con actividad" valor={errors.auditoria ? '—' : formatoNumero(usuariosConActividad)} href="/auditoria" cargando={cargando} />
        <KpiCard etiqueta="Tipos de actividad" valor={errors.auditoria ? '—' : formatoNumero(tiposActividad)} href="/auditoria" cargando={cargando} />
      </section>
      <ActividadAuditoria
        eventos={eventos}
        error={errors.auditoria}
        cargando={cargando}
      />
    </>
  );
}

export default function DashboardPage({ modo = 'panel' }) {
  const { user } = useAuth();
  const [sections, setSections] = useState({});
  const [errors, setErrors] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    const solicitudes = [];

    if (modo === 'reportes') {
      solicitudes.push(['resumen', resumen()]);
      if (['administrador', 'auditor'].includes(user?.rol)) {
        solicitudes.push(['auditoria', listarAuditoria()]);
      }
    } else if (user?.rol === 'administrador') {
      solicitudes.push(
        ['resumen', resumen()],
        ['usuarios', listarUsuarios()],
        ['auditoria', listarAuditoria()],
        ['tickets', listarTickets().then((respuesta) => respuesta.tickets || [])],
        ['prestamos', listarPrestamos()],
        ['prestamosEstado', listarPrestamosPorEstado()],
      );
    } else if (user?.rol === 'gerente') {
      solicitudes.push(
        ['resumen', resumen()],
        ['prestamos', listarPrestamos()],
        ['prestamosEstado', listarPrestamosPorEstado()],
      );
    } else if (user?.rol === 'oficial_credito') {
      solicitudes.push(['prestamos', listarPrestamos()]);
    } else if (user?.rol === 'cajero') {
      solicitudes.push(['resumen', resumen()], ['prestamos', listarPrestamos()]);
    } else if (user?.rol === 'auditor') {
      solicitudes.push(['auditoria', listarAuditoria()]);
    }

    setCargando(true);
    Promise.all(solicitudes.map(async ([clave, solicitud]) => {
      try {
        return [clave, { data: await solicitud }];
      } catch (error) {
        return [clave, { error: mensajeError(error, 'No se pudo cargar esta información.') }];
      }
    })).then((resultados) => {
      if (!activo) return;
      const cargados = Object.fromEntries(resultados);
      setSections(Object.fromEntries(
        Object.entries(cargados).map(([clave, resultado]) => [clave, resultado.data])
      ));
      setErrors(Object.fromEntries(
        Object.entries(cargados)
          .filter(([, resultado]) => resultado.error)
          .map(([clave, resultado]) => [clave, resultado.error])
      ));
    }).finally(() => {
      if (activo) setCargando(false);
    });

    return () => { activo = false; };
  }, [modo, user?.rol]);

  const esPanel = modo === 'panel';
  const esReportes = modo === 'reportes';
  const ver = (clave) => REPORTES_POR_ROL[user?.rol]?.includes(clave);
  const titulo = useMemo(() => user?.nombre ? `Hola, ${user.nombre}` : 'Panel principal', [user?.nombre]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <span className="dashboard-eyebrow">{ETIQUETAS_ROL[user?.rol] || 'Cooperativa'}</span>
        <h1>{esReportes ? 'Reportes' : esPanel ? titulo : 'Panel'}</h1>
        <p>
          {esReportes
            ? 'Indicadores de cartera, préstamos, cuentas e ingresos para supervisión.'
            : DESCRIPCIONES_ROL[user?.rol] || 'Resumen general del sistema.'}
        </p>
      </header>

      {errors.resumen && (
        <EmptyState error>{errors.resumen}</EmptyState>
      )}

      {esPanel && user?.rol === 'administrador' && (
        <PanelAdministrador data={sections} errors={errors} cargando={cargando} />
      )}
      {esPanel && user?.rol === 'oficial_credito' && (
        <PanelOficialCredito data={sections} errors={errors} cargando={cargando} />
      )}
      {esPanel && user?.rol === 'cajero' && (
        <PanelCajero data={sections} errors={errors} cargando={cargando} />
      )}
      {esPanel && user?.rol === 'gerente' && (
        <PanelGerente data={sections} errors={errors} cargando={cargando} />
      )}
      {esPanel && user?.rol === 'auditor' && (
        <PanelAuditor data={sections} errors={errors} cargando={cargando} />
      )}
      {esReportes && (
        <>
          {ver('socios') && <TotalSocios data={sections.resumen} />}
          <div className="dashboard-report-grid">
            {ver('mes') && <div className="dashboard-report-item"><ResumenMes /></div>}
            {ver('cuentas') && <div className="dashboard-report-item"><CuentasAbiertasCerradas /></div>}
            {ver('prestado') && <div className="dashboard-report-item"><PrestadoVsIngresos /></div>}
            {ver('tipo') && <div className="dashboard-report-item"><PrestamosPorTipo /></div>}
          </div>
          {ver('auditoria') && (
            <section aria-labelledby="dashboard-report-auditoria-title">
              <div className="dashboard-section-heading">
                <div>
                  <h2 id="dashboard-report-auditoria-title">Actividad de bitácora</h2>
                  <p>Resumen de las acciones registradas en el sistema.</p>
                </div>
              </div>
              <ActividadAuditoria
                eventos={sections.auditoria || []}
                error={errors.auditoria}
                cargando={cargando}
                mostrarEnlace={false}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
