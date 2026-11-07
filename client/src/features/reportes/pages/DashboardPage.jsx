import { useEffect, useState } from 'react';
import { resumen } from '../services/reportes.service';
import { useAuth } from '../../../context/AuthContext.jsx';
import ResumenMes from '../components/ResumenMes.jsx';
import PrestadoVsIngresos from '../components/PrestadoVsIngresos.jsx';
import CuentasAbiertasCerradas from '../components/CuentasAbiertasCerradas.jsx';
import PrestamosPorTipo from '../components/PrestamosPorTipo.jsx';

export default function DashboardPage({ modo = 'panel' }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const puedeVerResumen = ['administrador', 'gerente', 'oficial_credito'].includes(user?.rol);

  useEffect(() => {
    resumen()
      .then(setData)
      .catch((err) => setError(err.response?.data?.error?.message || 'No se pudo cargar el resumen'));
  }, []);

  const esPanel = modo === 'panel';
  const esReportes = modo === 'reportes';

  return (
    <div>
      {esPanel && (
        <>
          <h3>Bienvenido, {user?.nombre}</h3>
          <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Resumen general del sistema</p>
        </>
      )}
      {esReportes && <h3>Reportes</h3>}

      {error && <div className="alert error">{error}</div>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 20, marginTop: 2 }}>
          {puedeVerResumen && (
            <>
              <div className="card">
                <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--forest)' }}>{data.sociosTotal}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Total de socios</div>
              </div>
              <div className="card">
                <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--forest)' }}>{data.totalSocios}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Socios activos</div>
              </div>
              <div className="card">
                <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--danger)' }}>{data.sociosInactivos}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Socios inactivos</div>
              </div>
            </>
          )}
          <div className="card">
            <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--forest)' }}>RD$ {Number(data.totalAhorros).toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>En cuentas de ahorro</div>
          </div>
          <div className="card">
            <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--forest)' }}>{data.prestamosVigentes}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Préstamos vigentes</div>
          </div>
          <div className="card">
            <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--danger)' }}>{data.cuotasEnMora}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Cuotas en mora</div>
          </div>
        </div>
      )}
      {esReportes && puedeVerResumen && (
        <>
          <ResumenMes />
          <CuentasAbiertasCerradas />
          <PrestadoVsIngresos />
          <PrestamosPorTipo />
        </>
      )}
    </div>
  );
}
