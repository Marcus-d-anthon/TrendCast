import { useAuth } from './useAuth';

/**
 * Espeja la matriz roles_permisos del backend (ver
 * backend/src/lib/permisos-matriz.ts): el usuario ya trae su lista de
 * codigos "modulo.accion" desde el login/refresh, asi que no hace falta una
 * llamada de red aparte para saber que puede ver cada uno. ADMIN no es un
 * caso especial aqui -- el backend ya le siembra todos los codigos, asi que
 * un simple `includes` alcanza para cualquier rol.
 */
export function usePermiso(codigo: string): boolean {
  const { usuario } = useAuth();
  return usuario?.permisos.includes(codigo) ?? false;
}

/** Verdadero si el usuario tiene AL MENOS uno de los codigos dados. */
export function useAlgunPermiso(...codigos: string[]): boolean {
  const { usuario } = useAuth();
  if (!usuario) return false;
  return codigos.some((codigo) => usuario.permisos.includes(codigo));
}
