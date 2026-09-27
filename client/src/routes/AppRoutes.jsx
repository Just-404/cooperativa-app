import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';

import LoginPage from '../features/auth/pages/LoginPage.jsx';
import DashboardPage from '../features/reportes/pages/DashboardPage.jsx';
import SociosPage from '../features/socios/pages/SociosPage.jsx';
import SocioDetallePage from '../features/socios/pages/SocioDetallePage.jsx';
import PrestamosPage from '../features/prestamos/pages/PrestamosPage.jsx';
import PrestamoDetallePage from '../features/prestamos/pages/PrestamoDetallePage.jsx';
import CuotasPagosPage from '../features/cuotas-pagos/pages/CuotasPagosPage.jsx';
import UsuariosRolesPage from '../features/usuarios-roles/pages/UsuariosRolesPage.jsx';
import AuditoriaPage from '../features/auditoria/pages/AuditoriaPage.jsx';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/socios" element={<SociosPage />} />
            <Route path="/socios/:id" element={<SocioDetallePage />} />
            <Route path="/prestamos" element={<PrestamosPage />} />
            <Route path="/prestamos/:id" element={<PrestamoDetallePage />} />
            <Route path="/pagos" element={<CuotasPagosPage />} />
            <Route path="/reportes" element={<DashboardPage />} />

            <Route element={<ProtectedRoute roles={['administrador']} />}>
              <Route path="/usuarios" element={<UsuariosRolesPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['administrador', 'auditor']} />}>
              <Route path="/auditoria" element={<AuditoriaPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
