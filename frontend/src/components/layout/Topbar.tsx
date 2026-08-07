import { LogOut, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';
import { roleLabels, initials } from '../../utils/role-labels';
import { navItems } from './nav-items';
import styles from './Topbar.module.css';

function pageTitle(pathname: string): string {
  const item = navItems.find((entry) => (entry.to === '/' ? pathname === '/' : pathname.startsWith(entry.to)));
  return item?.label ?? 'TrendCast';
}

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  return (
    <header className={styles.topbar}>
      <div className={styles.titleGroup}>
        <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="Abrir menú">
          <Menu size={20} aria-hidden="true" />
        </button>
        <span className={styles.title}>{pageTitle(location.pathname)}</span>
      </div>

      {usuario && (
        <div className={styles.userBlock}>
          <ThemeToggle />
          <div>
            <div className={styles.userName}>{usuario.nombre}</div>
            <div className={styles.userRole}>{roleLabels[usuario.rol]}</div>
          </div>
          <div className={styles.avatar}>{initials(usuario.nombre)}</div>
          <button type="button" className={styles.logoutButton} onClick={logout} aria-label="Cerrar sesión">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}
