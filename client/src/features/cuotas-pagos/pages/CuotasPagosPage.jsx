import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarEnMora } from '../services/cuotas-pagos.service';
import EstadoTag from '../../../components/common/EstadoTag.jsx';

export default function CuotasPagosPage() {
  const [cuotas, setCuotas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    listarEnMora().then(setCuotas).catch(() => setError('No se pudo cargar la mora'));
  }, []);

  return (
    <div>
      <h3>Cuotas en mora</h3>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
        Para registrar un pago, entra al préstamo correspondiente desde su detalle.
      </p>
      {error && <div className="alert error">{error}</div>}
      <table className="ledger">
        <thead><tr><th>Socio</th><th>Cuota #</th><th>Vencimiento</th><th>Monto</th><th>Mora</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {cuotas.map((c) => (
            <tr key={c.id}>
              <td>{c.prestamo?.socio?.nombre} {c.prestamo?.socio?.apellido}</td>
              <td>{c.numeroCuota}</td>
              <td>{new Date(c.fechaVencimiento).toLocaleDateString()}</td>
              <td className="mono">{Number(c.montoTotal).toLocaleString()}</td>
              <td className="mono">{Number(c.montoMora).toLocaleString()}</td>
              <td><EstadoTag estado={c.estado} /></td>
              <td><Link to={`/prestamos/${c.prestamo?.id}`}>Ver préstamo</Link></td>
            </tr>
          ))}
          {cuotas.length === 0 && <tr><td colSpan="7" style={{ color: 'var(--ink-soft)' }}>No hay cuotas en mora.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
