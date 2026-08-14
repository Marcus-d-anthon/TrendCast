import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { TrendCastMark } from '../brand/TrendCastMark';
import { navItems } from './nav-items';
import styles from './Sidebar.module.css';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  colapsado: boolean;
}

function SidebarNav({ onNavigate, colapsado }: { onNavigate: () => void; colapsado: boolean }) {
  const { usuario } = useAuth();
  const visibleItems = navItems.filter((item) => {
    const tienePermiso = !item.permiso || Boolean(usuario?.permisos.includes(item.permiso));
    const tieneRol = !item.rolesExtra || Boolean(usuario && item.rolesExtra.includes(usuario.rol));
    const noOculto = !item.ocultarPara || !usuario || !item.ocultarPara.includes(usuario.rol);
    return tienePermiso && tieneRol && noOculto;
  });

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
            {!colapsado && item.badge && <span className={styles.navBadge}>{item.badge}</span>}
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
// especificidad. El colapso a solo-iconos es exclusivo de escritorio: en
// movil la sidebar ya se oculta por completo entre navegaciones, asi que un
// segundo modo "angosto" no aporta nada ahi. El boton que dispara el colapso
// vive en el Topbar (junto al nombre de la vista), no aqui.
export function Sidebar({ open, onClose, colapsado }: SidebarProps) {
  return (
    <>
      <aside className={[styles.sidebarDesktop, colapsado ? styles.colapsado : ''].filter(Boolean).join(' ')}>
        <SidebarNav onNavigate={onClose} colapsado={colapsado} />
      </aside>

      {open && (
        <>
          <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
          <aside className={styles.sidebarMobile}>
            <SidebarNav onNavigate={onClose} colapsado={false} />
          </aside>
        </>
      )}
    </>
  );
}
