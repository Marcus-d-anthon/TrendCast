export type Rol = 'ADMIN' | 'SUPERVISOR' | 'BODEGA' | 'VENTAS' | 'GERENCIA';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}
