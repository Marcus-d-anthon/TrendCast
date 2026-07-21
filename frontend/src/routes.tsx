import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Skeleton } from './components/ui/Skeleton';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductosListPage } from './pages/productos/ProductosListPage';
import { ProductoDetailPage } from './pages/productos/ProductoDetailPage';
import { CategoriasPage } from './pages/categorias/CategoriasPage';
import { MovimientosPage } from './pages/movimientos/MovimientosPage';
import { ComprasListPage } from './pages/compras/ComprasListPage';
import { CompraDetailPage } from './pages/compras/CompraDetailPage';
import { VentasListPage } from './pages/ventas/VentasListPage';
import { VentaDetailPage } from './pages/ventas/VentaDetailPage';
import { AlertasPage } from './pages/alertas/AlertasPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { ForbiddenPage } from './pages/errors/ForbiddenPage';

// Predicción y Reportes cargan Recharts (la dependencia más pesada del
// bundle): se separan en su propio chunk para no penalizar el arranque del
// resto de la app, que no los necesita.
const PrediccionPage = lazy(() =>
  import('./pages/prediccion/PrediccionPage').then((m) => ({ default: m.PrediccionPage }))
);
const ReportesPage = lazy(() => import('./pages/reportes/ReportesPage').then((m) => ({ default: m.ReportesPage })));

function ChartPageFallback() {
  return <Skeleton height="24rem" />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/productos" element={<ProductosListPage />} />
          <Route path="/productos/:id" element={<ProductoDetailPage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/movimientos" element={<MovimientosPage />} />

          <Route element={<RequireRole roles={['ADMIN', 'SUPERVISOR', 'GERENCIA']} />}>
            <Route path="/compras" element={<ComprasListPage />} />
            <Route path="/compras/:id" element={<CompraDetailPage />} />
          </Route>

          <Route element={<RequireRole roles={['ADMIN', 'SUPERVISOR', 'VENTAS', 'GERENCIA']} />}>
            <Route path="/ventas" element={<VentasListPage />} />
            <Route path="/ventas/:id" element={<VentaDetailPage />} />
          </Route>

          <Route path="/alertas" element={<AlertasPage />} />
          <Route
            path="/prediccion"
            element={
              <Suspense fallback={<ChartPageFallback />}>
                <PrediccionPage />
              </Suspense>
            }
          />
          <Route
            path="/reportes"
            element={
              <Suspense fallback={<ChartPageFallback />}>
                <ReportesPage />
              </Suspense>
            }
          />

          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
