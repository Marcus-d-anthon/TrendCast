import { Navigate, Outlet } from 'react-router-dom';
import type { Rol } from './types';
import { useAuth } from './useAuth';

// Complementario a RequirePermiso: para pantallas que dependen del ROL en si
// (ej. el panel de Super Admin) y no de un permiso "modulo.accion" de la
// matriz de negocio. `roles` es una lista blanca (solo esos roles entran);
// `excludeRoles` es una lista negra (todos menos esos roles entran) -- para
// vistas cuya API queda deliberadamente abierta a cualquier autenticado
// (ej. Categorias/Alertas/Prediccion) pero que un rol puntual no debe ver.
export function RequireRole({ roles, excludeRoles }: { roles?: Rol[]; excludeRoles?: Rol[] }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/403" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/403" replace />;
  if (excludeRoles && excludeRoles.includes(usuario.rol)) return <Navigate to="/403" replace />;

  return <Outlet />;
}
