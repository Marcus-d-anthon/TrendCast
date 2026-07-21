import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { FluxoMark } from '../brand/FluxoMark';
import { navItems } from './nav-items';
import styles from './Sidebar.module.css';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const { usuario } = useAuth();
  const visibleItems = navItems.filter((item) => !item.roles || (usuario && item.roles.includes(usuario.rol)));

  return (
    <>
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <FluxoMark size={26} />
          <span className={styles.brandMark}>Fluxo</span>
        </div>
        <span className={styles.brandTag}>Gestión de Inventarios</span>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
          >
            <item.icon size={18} className={styles.navIcon} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

// Version de escritorio: siempre montada, oculta via CSS (display:none) por
// debajo de 768px. Version movil: solo se monta en el DOM cuando "open" es
// verdadero -- montaje condicional de React en vez de un toggle por CSS,
// para que el estado abierto/cerrado no dependa de ninguna cascada de
// especificidad.
export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <aside className={styles.sidebarDesktop}>
        <SidebarNav onNavigate={onClose} />
      </aside>

      {open && (
        <>
          <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
          <aside className={styles.sidebarMobile}>
            <SidebarNav onNavigate={onClose} />
          </aside>
        </>
      )}
    </>
  );
}
