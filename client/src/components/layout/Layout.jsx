import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Panel', roles: null },
  { to: '/socios', label: 'Socios', roles: null },
  { to: '/prestamos', label: 'Préstamos', roles: null },
  { to: '/pagos', label: 'Cuotas y pagos', roles: null },
  { to: '/reportes', label: 'Reportes', roles: ['administrador', 'gerente', 'auditor'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['administrador'] },
  { to: '/auditoria', label: 'Auditoría', roles: ['administrador', 'auditor'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.rol));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh' }}>
      <aside style={{
        background: 'var(--paper-2)',
        borderRight: '1px solid var(--ledger-line)',
        padding: '18px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '0 18px 18px', borderBottom: '1px solid var(--ledger-line)', marginBottom: 12 }}>
          <strong style={{ fontFamily: "'Roboto Slab', serif", color: 'var(--forest)' }}>Cooperativa</strong>
        </div>
        <nav style={{ flex: 1 }}>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '9px 18px',
                fontSize: '0.85rem',
                textDecoration: 'none',
                color: isActive ? 'var(--forest)' : 'var(--ink-soft)',
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '3px solid var(--leaf)' : '3px solid transparent',
                background: isActive ? 'var(--card)' : 'transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--ledger-line)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{user?.nombre}</div>
          <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--moss)', marginBottom: 8 }}>{user?.rol}</div>
          <button className="btn ghost" onClick={handleLogout} style={{ width: '100%' }}>Cerrar sesión</button>
        </div>
      </aside>
      <main style={{ padding: '28px 32px' }}>
        <Outlet />
      </main>
    </div>
  );
}
