import { useEffect, useState } from 'react';
import { resumen } from '../services/reportes.service';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    resumen()
      .then(setData)
      .catch((err) => setError(err.response?.data?.error?.message || 'No se pudo cargar el resumen'));
  }, []);

  return (
    <div>
      <h3>Bienvenido, {user?.nombre}</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Resumen general del sistema</p>

      {error && <div className="alert error">{error}</div>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 20 }}>
          <div className="card">
            <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--forest)' }}>{data.totalSocios}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Socios activos</div>
          </div>
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
    </div>
  );
}
