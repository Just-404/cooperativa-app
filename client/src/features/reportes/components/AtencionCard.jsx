import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AtencionCard({ href, etiqueta, cantidad }) {
  return (
    <Link className="dashboard-attention-card" to={href}>
      <span className="dashboard-attention-count">{cantidad}</span>
      <span className="dashboard-attention-label">{etiqueta}</span>
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}
