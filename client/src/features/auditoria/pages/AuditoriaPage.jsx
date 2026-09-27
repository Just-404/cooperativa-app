import { useEffect, useState } from 'react';
import { listar } from '../services/auditoria.service';

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    listar().then(setEventos).catch(() => setError('No se pudo cargar la auditoría'));
  }, []);

  return (
    <div>
      <h3>Auditoría</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Últimas 200 acciones registradas en el sistema.</p>
      {error && <div className="alert error">{error}</div>}
      <table className="ledger">
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead>
        <tbody>
          {eventos.map((e) => (
            <tr key={e.id}>
              <td className="mono">{new Date(e.fecha).toLocaleString()}</td>
              <td>{e.usuario?.nombre || '—'}</td>
              <td>{e.accion}</td>
            </tr>
          ))}
          {eventos.length === 0 && <tr><td colSpan="3" style={{ color: 'var(--ink-soft)' }}>Sin eventos registrados aún.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
