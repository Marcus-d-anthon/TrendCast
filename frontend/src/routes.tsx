import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Skeleton } from './components/ui/Skeleton';
import { RequireAuth } from './auth/RequireAuth';
import { RequirePermiso } from './auth/RequirePermiso';
import { RequireRole } from './auth/RequireRole';
import { LoginPage } from './pages/login/LoginPage';
import { HomeDispatcher } from './pages/dashboard/HomeDispatcher';
import { ProductosListPage } from './pages/productos/ProductosListPage';
import { ProductoDetailPage } from './pages/productos/ProductoDetailPage';
import { CargaMasivaProductosPage } from './pages/productos/CargaMasivaProductosPage';
import { CategoriasPage } from './pages/categorias/CategoriasPage';
import { MovimientosPage } from './pages/movimientos/MovimientosPage';
import { ComprasListPage } from './pages/compras/ComprasListPage';
import { CompraDetailPage } from './pages/compras/CompraDetailPage';
import { VentasListPage } from './pages/ventas/VentasListPage';
import { VentaDetailPage } from './pages/ventas/VentaDetailPage';
import { AlertasPage } from './pages/alertas/AlertasPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { AdminPage } from './pages/admin/AdminPage';
import { ErroresPage } from './pages/errores/ErroresPage';
import { SolicitudesPage } from './pages/solicitudes/SolicitudesPage';
import { MiCuentaPage } from './pages/cuenta/MiCuentaPage';
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
          <Route path="/" element={<HomeDispatcher />} />
          <Route path="/productos" element={<ProductosListPage />} />
          <Route element={<RequirePermiso permiso="productos.crear" />}>
            <Route path="/productos/carga-masiva" element={<CargaMasivaProductosPage />} />
          </Route>
          <Route path="/productos/:id" element={<ProductoDetailPage />} />
          <Route element={<RequireRole excludeRoles={['BODEGA']} />}>
            <Route path="/categorias" element={<CategoriasPage />} />
          </Route>
          <Route path="/movimientos" element={<MovimientosPage />} />

          <Route element={<RequirePermiso permiso="compras.ver" />}>
            <Route path="/compras" element={<ComprasListPage />} />
            <Route path="/compras/:id" element={<CompraDetailPage />} />
          </Route>

          <Route element={<RequirePermiso permiso="ventas.ver" />}>
            <Route path="/ventas" element={<VentasListPage />} />
            <Route path="/ventas/:id" element={<VentaDetailPage />} />
          </Route>

          <Route element={<RequireRole excludeRoles={['BODEGA']} />}>
            <Route path="/alertas" element={<AlertasPage />} />
            <Route
              path="/prediccion"
              element={
                <Suspense fallback={<ChartPageFallback />}>
                  <PrediccionPage />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="/reportes"
            element={
              <Suspense fallback={<ChartPageFallback />}>
                <ReportesPage />
              </Suspense>
            }
          />

          <Route element={<RequirePermiso permiso="usuarios.ver" />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>

          <Route element={<RequireRole roles={['SUPERUSUARIO']} />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/errores" element={<ErroresPage />} />
          </Route>

          <Route element={<RequirePermiso permiso="solicitudes.ver" />}>
            <Route path="/solicitudes" element={<SolicitudesPage />} />
          </Route>

          <Route path="/mi-cuenta" element={<MiCuentaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
