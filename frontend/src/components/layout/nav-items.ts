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
import type { Rol } from '../../auth/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Si se omite, visible para cualquier usuario autenticado. */
  roles?: Rol[];
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  {
    to: '/compras',
    label: 'Compras',
    icon: ShoppingCart,
    roles: ['ADMIN', 'SUPERVISOR', 'GERENCIA'],
  },
  {
    to: '/ventas',
    label: 'Ventas',
    icon: Receipt,
    roles: ['ADMIN', 'SUPERVISOR', 'VENTAS', 'GERENCIA'],
  },
  { to: '/alertas', label: 'Alertas', icon: AlertTriangle },
  { to: '/prediccion', label: 'Predicción', icon: TrendingUp },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
];
