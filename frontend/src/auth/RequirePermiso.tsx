import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

// Este gating es UX, no seguridad: la autoridad real ya la aplica el
// backend (requirePermission en PermissionMiddleware.ts, misma matriz
// roles_permisos). Aqui solo evitamos mostrar rutas que el usuario no
// podria completar. Sigue la matriz de permisos real (no una lista de
// roles fija en el codigo): si un admin le agrega "compras.ver" a VENTAS
// desde la base de datos, esta ruta se abre sin tocar el frontend.
export function RequirePermiso({ permiso }: { permiso: string }) {
  const { usuario } = useAuth();

  if (!usuario || !usuario.permisos.includes(permiso)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
