import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PanelCabecera({ titulo, descripcion, enlace, textoEnlace, children }) {
  return (
    <div className="dashboard-section-heading">
      <div>
        <h2>{titulo}</h2>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {children && <div className="dashboard-section-actions">{children}</div>}
      {enlace && (
        <Link className="dashboard-text-link" to={enlace}>
          {textoEnlace}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
