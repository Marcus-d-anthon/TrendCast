import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Bug,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Tags,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Rol } from '../../auth/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /**
   * Código "modulo.ver" de la matriz de permisos (ver
   * backend/src/lib/permisos-matriz.ts). Si se omite, el item es visible
   * para cualquier usuario autenticado -- son los módulos que hoy no tienen
   * matriz granular propia (Dashboard, Categorías, Movimientos, Alertas,
   * Predicción).
   */
  permiso?: string;
  /** Restringe el item a roles puntuales (ej. el panel de Super Admin), en vez de un permiso de la matriz. */
  rolesExtra?: Rol[];
  /**
   * Oculta el item para roles puntuales aunque tengan el permiso/no tengan
   * gate alguno -- para módulos cuya API queda deliberadamente abierta a
   * cualquier autenticado (Categorías, Movimientos, Alertas, Predicción) pero
   * que no le corresponden a la experiencia de un rol específico (ej. Bodega).
   */
  ocultarPara?: Rol[];
  /** Distintivo visual junto al label (ej. "WIP" en un módulo en desarrollo). */
  badge?: string;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package, permiso: 'productos.ver' },
  { to: '/categorias', label: 'Categorías', icon: Tags, ocultarPara: ['BODEGA'] },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/compras', label: 'Compras', icon: ShoppingCart, permiso: 'compras.ver' },
  { to: '/ventas', label: 'Ventas', icon: Receipt, permiso: 'ventas.ver' },
  { to: '/alertas', label: 'Alertas', icon: AlertTriangle, ocultarPara: ['BODEGA'] },
  { to: '/prediccion', label: 'Predicción', icon: TrendingUp, ocultarPara: ['BODEGA'] },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, permiso: 'reportes.ver' },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList, permiso: 'solicitudes.ver' },
  { to: '/usuarios', label: 'Usuarios', icon: Users, permiso: 'usuarios.ver' },
  { to: '/admin', label: 'Super Admin', icon: ShieldCheck, rolesExtra: ['SUPERUSUARIO'] },
  // Rastro tecnico de excepciones 500 -- solo compete a Super Admin, ver
  // ErroresRoutes.ts (mismo criterio que /admin).
  { to: '/errores', label: 'Errores del sistema', icon: Bug, rolesExtra: ['SUPERUSUARIO'] },
];
