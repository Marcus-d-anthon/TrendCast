import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { Rol } from './types';

// Este gating es UX, no seguridad: la autoridad real ya la aplica el
// backend (requireRole en roles.middleware.ts). Aqui solo evitamos mostrar
// rutas que el usuario no podria completar.
export function RequireRole({ roles }: { roles: Rol[] }) {
  const { usuario } = useAuth();

  if (!usuario || !roles.includes(usuario.rol)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
