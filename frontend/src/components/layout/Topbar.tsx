import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { EmpresaVistaSelect } from './EmpresaVistaSelect';
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
  colapsado: boolean;
  onToggleColapsado: () => void;
}

export function Topbar({ onMenuClick, colapsado, onToggleColapsado }: TopbarProps) {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  return (
    <header className={styles.topbar}>
      <div className={styles.titleGroup}>
        <button type="button" className={styles.menuButton} onClick={onMenuClick} aria-label="Abrir menú">
          <Menu size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={onToggleColapsado}
          aria-label={colapsado ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <span className={styles.title}>{pageTitle(location.pathname)}</span>
      </div>

      {usuario && (
        <div className={styles.userBlock}>
          {usuario.rol === 'SUPERUSUARIO' && <EmpresaVistaSelect />}
          <ThemeToggle />
          <div>
            <div className={styles.userName}>{usuario.nombre}</div>
            <div className={styles.userRole}>{roleLabels[usuario.rol]}</div>
          </div>
          <div className={styles.avatar}>{initials(usuario.nombre)}</div>
          <Link to="/mi-cuenta" className={styles.logoutButton} aria-label="Seguridad de la cuenta" title="Seguridad de la cuenta">
            <ShieldCheck size={18} aria-hidden="true" />
          </Link>
          <button type="button" className={styles.logoutButton} onClick={logout} aria-label="Cerrar sesión">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}
