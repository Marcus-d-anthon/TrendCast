export type Rol = 'ADMIN' | 'SUPERVISOR' | 'BODEGA' | 'VENTAS' | 'GERENCIA';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  /** Códigos "modulo.accion" (ej. "productos.crear") vigentes para el rol de este usuario. */
  permisos: string[];
}
