import { useAuth } from '../../auth/useAuth';
import { BodegaDashboard } from './BodegaDashboard';
import { DashboardPage } from './DashboardPage';
import { GerenciaDashboard } from './GerenciaDashboard';
import { VentasDashboard } from './VentasDashboard';

// Cada rol aterriza en la vista que realmente necesita en vez de un
// dashboard generico: Gerencia solo monitorea, Bodega ve su almacen, Ventas
// ve su cartera de clientes. ADMIN, SUPERVISOR y SUPERUSUARIO conservan el
// dashboard general (sin cambios).
export function HomeDispatcher() {
  const { usuario } = useAuth();

  if (usuario?.rol === 'GERENCIA') return <GerenciaDashboard />;
  if (usuario?.rol === 'BODEGA') return <BodegaDashboard />;
  if (usuario?.rol === 'VENTAS') return <VentasDashboard />;

  return <DashboardPage />;
}
