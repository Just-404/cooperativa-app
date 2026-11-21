import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  ClipboardList,
  HandCoins,
  TicketCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import { resumen } from '../services/reportes.service';
import ResumenMes from '../components/ResumenMes.jsx';
import PrestadoVsIngresos from '../components/PrestadoVsIngresos.jsx';
import CuentasAbiertasCerradas from '../components/CuentasAbiertasCerradas.jsx';
import PrestamosPorTipo from '../components/PrestamosPorTipo.jsx';
import TotalSocios from '../components/TotalSocios.jsx';

const ETIQUETAS_ROL = {
  administrador: 'Administrador',
  cajero: 'Cajero',
  oficial_credito: 'Oficial de Crédito',
  gerente: 'Gerente',
  auditor: 'Auditor',
};

const ETIQUETAS_ESTADO_PRESTAMO = {
  solicitado: 'Solicitado',
  en_evaluacion: 'En evaluación',
  evaluado: 'Evaluado',
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
  crear_usuario: 'Usuario creado',
  actualizar_usuario: 'Usuario actualizado',
  cambiar_estado_usuario: 'Estado de usuario cambiado',
  crear_socio: 'Socio creado',
  actualizar_socio: 'Socio actualizado',
};

const ESTADOS_TICKET = [
  { estado: 'pending', etiqueta: 'Pendientes', color: '#b88b2d' },
  { estado: 'resolved', etiqueta: 'Resueltos', color: '#3f7d4e' },
  { estado: 'cancelled', etiqueta: 'Cancelados', color: '#a94442' },
];

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

function PanelCabecera({ titulo, descripcion, enlace, textoEnlace }) {
  return (
    <div className="dashboard-section-heading">
      <div>
        <h2>{titulo}</h2>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {enlace && (
        <Link className="dashboard-text-link" to={enlace}>
          {textoEnlace}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function TarjetaIndicador({ icono: Icono, etiqueta, valor, detalle, tono = '' }) {
  return (
    <article className={`dashboard-stat${tono ? ` dashboard-stat-${tono}` : ''}`}>
      <span className="dashboard-stat-icon" aria-hidden="true">
        <Icono size={20} strokeWidth={1.8} />
      </span>
      <div className="dashboard-stat-copy">
        <span className="dashboard-stat-label">{etiqueta}</span>
        <strong className="dashboard-stat-value">{valor}</strong>
        {detalle && <span className="dashboard-stat-detail">{detalle}</span>}
      </div>
    </article>
  );
}

function ErrorSeccion({ error }) {
  return error ? <p className="dashboard-inline-error" role="alert">{error}</p> : null;
}

function GraficoBarras({ datos, descripcion, color, anchoEtiqueta = 150 }) {
  if (!datos.some((fila) => fila.cantidad > 0)) {
    return <p className="dashboard-chart-empty">No hay datos para mostrar todavía.</p>;
  }

  return (
    <div className="dashboard-chart" role="img" aria-label={descripcion}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#4B5A4C' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="etiqueta"
            width={anchoEtiqueta}
            tick={{ fontSize: 11, fill: '#4B5A4C' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#eef3e9' }}
            formatter={(valor) => [formatoNumero(valor), 'Cantidad']}
          />
          <Bar dataKey="cantidad" fill={color} radius={[0, 5, 5, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResumenGeneral({ data }) {
  if (!data) return null;

  return (
    <section className="dashboard-general" aria-label="Resumen general">
      <TarjetaIndicador icono={Users} etiqueta="Total de socios" valor={formatoNumero(data.sociosTotal)} />
      <TarjetaIndicador icono={Users} etiqueta="Socios activos" valor={formatoNumero(data.totalSocios)} />
      <TarjetaIndicador
        icono={Users}
        etiqueta="Socios inactivos"
        valor={formatoNumero(data.sociosInactivos)}
        tono={data.sociosInactivos > 0 ? 'warning' : ''}
      />
      <TarjetaIndicador
        icono={HandCoins}
        etiqueta="Préstamos vigentes"
        valor={formatoNumero(data.prestamosVigentes)}
      />
      <TarjetaIndicador
        icono={ClipboardList}
        etiqueta="Cuotas en mora"
        valor={formatoNumero(data.cuotasEnMora)}
        tono={data.cuotasEnMora > 0 ? 'warning' : ''}
      />
      <TarjetaIndicador
        icono={HandCoins}
        etiqueta="Ahorros administrados"
        valor={formatoMoneda(data.totalAhorros)}
      />
    </section>
  );
}

function PanelAdministrador({ data, errors }) {
  const usuarios = data.usuarios || [];
  const auditoria = data.auditoria || [];
  const ticketsPendientes = data.tickets?.filter((ticket) => ticket.estado === 'pending') || [];
  const usuariosPorRol = useMemo(() => {
    const conteo = new Map();
    usuarios.forEach((usuario) => {
      conteo.set(usuario.rol, (conteo.get(usuario.rol) || 0) + 1);
    });
    return Object.entries(ETIQUETAS_ROL).map(([rol, etiqueta]) => ({
      rol,
      etiqueta,
      cantidad: conteo.get(rol) || 0,
    }));
  }, [usuarios]);
  const actividadPorTipo = useMemo(() => {
    const conteo = new Map();
    auditoria.forEach((evento) => {
      const accion = evento.accion || 'otra';
      conteo.set(accion, (conteo.get(accion) || 0) + 1);
    });
    return Array.from(conteo, ([accion, cantidad]) => ({
      etiqueta: ETIQUETAS_ACCION[accion] || String(accion).replace(/_/g, ' '),
      cantidad,
    }))
      .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'))
      .slice(0, 6);
  }, [auditoria]);
  const ticketsPorEstado = ESTADOS_TICKET.map(({ estado, etiqueta, color }) => ({
    estado,
    etiqueta,
    color,
    cantidad: data.tickets?.filter((ticket) => ticket.estado === estado).length || 0,
  }));

  return (
    <>
      <section className="dashboard-stats" aria-label="Indicadores de administración">
        <TarjetaIndicador
          icono={TicketCheck}
          etiqueta="Tickets pendientes"
          valor={errors.tickets ? '—' : formatoNumero(ticketsPendientes.length)}
          tono={ticketsPendientes.length > 0 ? 'warning' : ''}
        />
        <TarjetaIndicador
          icono={Users}
          etiqueta="Usuarios registrados"
          valor={errors.usuarios ? '—' : formatoNumero(usuarios.length)}
        />
        <TarjetaIndicador
          icono={Activity}
          etiqueta="Tipos de movimiento"
          valor={errors.auditoria ? '—' : formatoNumero(actividadPorTipo.length)}
          detalle="Categorías recientes de auditoría"
        />
      </section>

      <div className="dashboard-chart-grid">
        <section className="dashboard-panel">
          <PanelCabecera
            titulo="Usuarios del sistema"
            descripcion="Cantidad de cuentas registradas por rol."
            enlace="/usuarios"
            textoEnlace="Administrar usuarios"
          />
          <ErrorSeccion error={errors.usuarios} />
          {!errors.usuarios && (
            <GraficoBarras
              datos={usuariosPorRol}
              descripcion="Cantidad de usuarios registrados por rol"
              color="#3f7d4e"
              anchoEtiqueta={138}
            />
          )}
        </section>

        <section className="dashboard-panel">
          <PanelCabecera
            titulo="Últimos movimientos"
            descripcion="Tipos de actividad en los registros recientes."
            enlace="/auditoria"
            textoEnlace="Ver auditoría"
          />
          <ErrorSeccion error={errors.auditoria} />
          {!errors.auditoria && (
            <GraficoBarras
              datos={actividadPorTipo}
              descripcion="Cantidad de movimientos recientes por tipo de actividad"
              color="#527b9a"
              anchoEtiqueta={150}
            />
          )}
        </section>
      </div>

      <section className="dashboard-panel">
        <PanelCabecera
          titulo="Estado de los tickets"
          descripcion="Distribución de las solicitudes de atención registradas."
          enlace="/tickets"
          textoEnlace="Gestionar tickets"
        />
        <ErrorSeccion error={errors.tickets} />
        {!errors.tickets && (
          <div className="dashboard-ticket-chart" role="img" aria-label="Tickets por estado">
            {data.tickets?.length ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketsPorEstado}
                      dataKey="cantidad"
                      nameKey="etiqueta"
                      innerRadius="48%"
                      outerRadius="72%"
                      paddingAngle={3}
                      stroke="none"
                    >
                      {ticketsPorEstado.map((item) => (
                        <Cell key={item.estado} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor) => [formatoNumero(valor), 'Tickets']} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '0.78rem', paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="dashboard-ticket-total">
                  {formatoNumero(data.tickets.length)}
                  <span>tickets</span>
                </p>
              </>
            ) : (
              <p className="dashboard-chart-empty">No hay tickets registrados todavía.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function PanelOficialCredito({ data, errors }) {
  const prestamos = data.prestamos || [];
  const pendientes = prestamos.filter((prestamo) =>
    ['solicitado', 'en_evaluacion', 'evaluado'].includes(prestamo.estado)
  );
  const porDesembolsar = prestamos.filter((prestamo) => prestamo.estado === 'aprobado');
  const prestamosPorEstado = Object.entries(ETIQUETAS_ESTADO_PRESTAMO).map(([estado, etiqueta]) => ({
    etiqueta,
    cantidad: prestamos.filter((prestamo) => prestamo.estado === estado).length,
  }));

  return (
    <>
      <section className="dashboard-stats" aria-label="Indicadores de crédito">
        <TarjetaIndicador
          icono={ClipboardList}
          etiqueta="Solicitudes por revisar"
          valor={errors.prestamos ? '—' : formatoNumero(pendientes.length)}
          tono={pendientes.length > 0 ? 'warning' : ''}
        />
        <TarjetaIndicador
          icono={HandCoins}
          etiqueta="Aprobados por desembolsar"
          valor={errors.prestamos ? '—' : formatoNumero(porDesembolsar.length)}
        />
        {data.resumen && (
          <TarjetaIndicador
            icono={HandCoins}
            etiqueta="Préstamos vigentes"
            valor={formatoNumero(data.resumen.prestamosVigentes)}
          />
        )}
      </section>

      <section className="dashboard-panel">
        <PanelCabecera
          titulo="Préstamos por estado"
          descripcion="Distribución de la cartera y solicitudes en curso."
          enlace="/prestamos"
          textoEnlace="Ver préstamos"
        />
        <ErrorSeccion error={errors.prestamos} />
        {!errors.prestamos && (
          <GraficoBarras
            datos={prestamosPorEstado}
            descripcion="Cantidad de préstamos por estado"
            color="#3f7d4e"
          />
        )}
      </section>

      {data.resumen && <ResumenGeneral data={data.resumen} />}
    </>
  );
}

function PanelCajero({ data }) {
  return (
    <>
      {data.resumen && <ResumenGeneral data={data.resumen} />}
      <section className="dashboard-panel">
        <PanelCabecera
          titulo="Operaciones de caja"
          descripcion="Accesos directos a las tareas frecuentes de atención."
        />
        <div className="dashboard-quick-links">
          <Link to="/pagos" className="dashboard-quick-link">
            <span className="dashboard-stat-icon" aria-hidden="true"><HandCoins size={20} /></span>
            <span><strong>Registrar o consultar pagos</strong><small>Gestionar cuotas y abonos de préstamos</small></span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/socios" className="dashboard-quick-link">
            <span className="dashboard-stat-icon" aria-hidden="true"><Users size={20} /></span>
            <span><strong>Buscar un socio</strong><small>Consultar sus datos y cuentas</small></span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/prestamos" className="dashboard-quick-link">
            <span className="dashboard-stat-icon" aria-hidden="true"><ClipboardList size={20} /></span>
            <span><strong>Consultar préstamos</strong><small>Revisar el estado de las solicitudes</small></span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
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
    const solicitudes = [['resumen', resumen()]];

    if (modo === 'panel' && user?.rol === 'administrador') {
      solicitudes.push(
        ['usuarios', listarUsuarios()],
        ['auditoria', listarAuditoria()],
        ['tickets', listarTickets().then((respuesta) => respuesta.tickets || [])]
      );
    } else if (modo === 'panel' && user?.rol === 'oficial_credito') {
      solicitudes.push(['prestamos', listarPrestamos()]);
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
  const puedeVerReportes = ['administrador', 'gerente', 'auditor'].includes(user?.rol);
  const titulo = useMemo(() => user?.nombre ? `Hola, ${user.nombre}` : 'Panel principal', [user?.nombre]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">{ETIQUETAS_ROL[user?.rol] || 'Cooperativa'}</span>
          <h1>{esReportes ? 'Reportes' : esPanel ? titulo : 'Panel'}</h1>
          {esPanel && (
            <p>
              {user?.rol === 'administrador' && 'Vista general de usuarios, tickets y actividad del sistema.'}
              {user?.rol === 'oficial_credito' && 'Seguimiento de solicitudes y cartera de crédito.'}
              {user?.rol === 'cajero' && 'Resumen operativo y accesos a las tareas de caja.'}
              {!['administrador', 'oficial_credito', 'cajero'].includes(user?.rol) && 'Resumen general del sistema.'}
            </p>
          )}
        </div>
      </header>

      {cargando && <p className="dashboard-loading" role="status">Cargando información del panel…</p>}
      {errors.resumen && <div className="alert error" role="alert">{errors.resumen}</div>}

      {esPanel && user?.rol === 'administrador' && (
        <>
          <PanelAdministrador data={sections} errors={errors} />
          {sections.resumen && <ResumenGeneral data={sections.resumen} />}
        </>
      )}
      {esPanel && user?.rol === 'oficial_credito' && (
        <PanelOficialCredito data={sections} errors={errors} />
      )}
      {esPanel && user?.rol === 'cajero' && <PanelCajero data={sections} />}
      {esPanel && !['administrador', 'oficial_credito', 'cajero'].includes(user?.rol) && (
        <ResumenGeneral data={sections.resumen} />
      )}

      {esReportes && puedeVerReportes && (
        <>
          <TotalSocios data={sections.resumen} />
          <ResumenMes />
          <CuentasAbiertasCerradas />
          <PrestadoVsIngresos />
          <PrestamosPorTipo />
        </>
      )}
    </div>
  );
}
