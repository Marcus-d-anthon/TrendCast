import type { Rol } from '../auth/types';

export const roleLabels: Record<Rol, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  BODEGA: 'Bodega',
  VENTAS: 'Ventas',
  GERENCIA: 'Gerencia',
};

export function initials(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const primera = partes[0]?.[0] ?? '';
  const segunda = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primera + segunda).toUpperCase();
}
