import { BrowserRouter, Routes, Route } from 'react-router-dom';

// TODO: importar páginas reales de cada módulo bajo src/features/*/pages

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Sistema de Gestión de Cooperativa</div>} />
        {/* Ejemplo:
        <Route path="/socios" element={<SociosPage />} />
        <Route path="/prestamos" element={<PrestamosPage />} />
        */}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
