import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Tags,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

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
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package, permiso: 'productos.ver' },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/compras', label: 'Compras', icon: ShoppingCart, permiso: 'compras.ver' },
  { to: '/ventas', label: 'Ventas', icon: Receipt, permiso: 'ventas.ver' },
  { to: '/alertas', label: 'Alertas', icon: AlertTriangle },
  { to: '/prediccion', label: 'Predicción', icon: TrendingUp },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, permiso: 'reportes.ver' },
  { to: '/usuarios', label: 'Usuarios', icon: Users, permiso: 'usuarios.ver' },
];
