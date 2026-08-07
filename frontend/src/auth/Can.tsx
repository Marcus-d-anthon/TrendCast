import type { ReactNode } from 'react';
import { usePermiso } from './usePermiso';

interface CanProps {
  permiso: string;
  children: ReactNode;
  /** Se muestra en lugar de `children` cuando el usuario NO tiene el permiso (opcional). */
  fallback?: ReactNode;
}

/** Oculta visualmente `children` (botones, secciones, filas de menú) cuando el usuario no tiene el permiso indicado. */
export function Can({ permiso, children, fallback = null }: CanProps) {
  const tienePermiso = usePermiso(permiso);
  return tienePermiso ? <>{children}</> : <>{fallback}</>;
}
