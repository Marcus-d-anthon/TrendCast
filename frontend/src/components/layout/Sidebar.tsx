import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { TrendCastMark } from '../brand/TrendCastMark';
import { navItems } from './nav-items';
import styles from './Sidebar.module.css';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  colapsado: boolean;
  onToggleColapsado: () => void;
}

function SidebarNav({ onNavigate, colapsado, onToggleColapsado, mostrarToggle }: {
  onNavigate: () => void;
  colapsado: boolean;
  onToggleColapsado: () => void;
  mostrarToggle: boolean;
}) {
  const { usuario } = useAuth();
  const visibleItems = navItems.filter((item) => !item.permiso || usuario?.permisos.includes(item.permiso));

  return (
    <>
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <TrendCastMark size={colapsado ? 32 : 26} />
          {!colapsado && <span className={styles.brandMark}>TrendCast</span>}
        </div>
        {!colapsado && <span className={styles.brandTag}>Gestión de Inventarios</span>}
      </div>

      <nav className={styles.nav}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            title={colapsado ? item.label : undefined}
            className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
          >
            <item.icon size={colapsado ? 22 : 18} className={styles.navIcon} aria-hidden="true" />
            {!colapsado && item.label}
          </NavLink>
        ))}
      </nav>

      {mostrarToggle && (
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={onToggleColapsado}
          aria-label={colapsado ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        >
          {colapsado ? <ChevronsRight size={18} aria-hidden="true" /> : <ChevronsLeft size={18} aria-hidden="true" />}
          {!colapsado && <span>Colapsar</span>}
        </button>
      )}
    </>
  );
}

// Version de escritorio: siempre montada, oculta via CSS (display:none) por
// debajo de 768px. Version movil: solo se monta en el DOM cuando "open" es
// verdadero -- montaje condicional de React en vez de un toggle por CSS,
// para que el estado abierto/cerrado no dependa de ninguna cascada de
// especificidad. El colapso a solo-iconos es exclusivo de escritorio: en
// movil la sidebar ya se oculta por completo entre navegaciones, asi que un
// segundo modo "angosto" no aporta nada ahi.
export function Sidebar({ open, onClose, colapsado, onToggleColapsado }: SidebarProps) {
  return (
    <>
      <aside className={[styles.sidebarDesktop, colapsado ? styles.colapsado : ''].filter(Boolean).join(' ')}>
        <SidebarNav onNavigate={onClose} colapsado={colapsado} onToggleColapsado={onToggleColapsado} mostrarToggle />
      </aside>

      {open && (
        <>
          <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
          <aside className={styles.sidebarMobile}>
            <SidebarNav onNavigate={onClose} colapsado={false} onToggleColapsado={onToggleColapsado} mostrarToggle={false} />
          </aside>
        </>
      )}
    </>
  );
}
