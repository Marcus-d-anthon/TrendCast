export type Rol = 'ADMIN' | 'SUPERVISOR' | 'BODEGA' | 'VENTAS' | 'GERENCIA' | 'SUPERUSUARIO';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  /** Códigos "modulo.accion" (ej. "productos.crear") vigentes para el rol de este usuario. */
  permisos: string[];
  /** Solo se usa (y solo tiene valor) cuando rol === 'BODEGA'. */
  almacenId?: string | null;
  /** Empresa propia del usuario (para SUPERUSUARIO, la que preselecciona el selector de empresa). */
  empresaId: string;
  /** Verificación en dos pasos (TOTP) activada para esta cuenta. */
  totpHabilitado: boolean;
}
