import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ChartColumn,
  ClipboardList,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Ticket,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { TicketReporte } from '../common/TicketReporte';

const NAV_ITEMS = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, roles: null },
  { to: '/socios', label: 'Socios', icon: Users, roles: null },
  { to: '/prestamos', label: 'Préstamos', icon: HandCoins, roles: null },
  { to: '/pagos', label: 'Cuotas y pagos', icon: ReceiptText, roles: null },
  { to: '/reportes', label: 'Reportes', icon: ChartColumn, roles: ['administrador', 'gerente', 'auditor'] },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['administrador'] },
  { to: '/auditoria', label: 'Auditoría', icon: ClipboardList, roles: ['administrador', 'auditor'] },
  { to: '/tickets', label: 'Tickets', icon: Ticket, roles: ['administrador', 'gerente', 'auditor'] },
];

const MOBILE_QUERY = '(max-width: 768px)';

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  const [collapsed, setCollapsed] = useState(() => {
    if (isMobileViewport()) return true;
    return localStorage.getItem('sidebar-collapsed') === '1';
  });

  const drawerOpen = isMobile && !collapsed;

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);

    function handleChange(event) {
      setIsMobile(event.matches);
      if (event.matches) {
        setCollapsed(true);
      }
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') setCollapsed(true);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      if (!isMobile) {
        localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      }
      return next;
    });
  }

  function handleNavClick() {
    if (isMobile) setCollapsed(true);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.rol));

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
        >
          <Menu size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        <strong className="app-topbar-brand">CoopAhorros</strong>
      </header>

      <div
        className={`sidebar-backdrop${drawerOpen ? ' is-visible' : ''}`}
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        className={`app-sidebar${collapsed ? ' is-collapsed' : ''}`}
        inert={isMobile && collapsed ? true : undefined}
      >
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Abrir menú' : 'Cerrar menú'}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
          >
            <Menu size={22} strokeWidth={2} aria-hidden="true" />
          </button>
          <div className="sidebar-user">
            <strong className="sidebar-brand">CoopAhorros</strong>
            <div className="sidebar-user-name">{user?.nombre}</div>
            <div className="sidebar-user-role mono">{user?.rol}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={handleNavClick}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
              >
                <Icon className="sidebar-icon" size={19} strokeWidth={1.9} aria-hidden="true" />
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <TicketReporte collapsed={collapsed} />
          <hr className="sidebar-divider" />
          <button
            type="button"
            className="btn ghost sidebar-action aside-footer-btn"
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="sidebar-icon" size={18} strokeWidth={1.9} aria-hidden="true" />
            <span className="sidebar-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
