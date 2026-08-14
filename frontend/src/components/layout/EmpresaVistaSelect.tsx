import { Building2 } from 'lucide-react';
import { cambiarEmpresaVista, getEmpresaVista } from '../../auth/empresa-vista';
import { useAuth } from '../../auth/useAuth';
import { Select } from '../ui/Select';
import { useAdminEmpresas } from '../../queries/useAdmin';
import styles from './EmpresaVistaSelect.module.css';

// Solo lo renderiza el Topbar para SUPERUSUARIO (ver Topbar.tsx). Cambiar de
// empresa recarga toda la app en vez de invalidar cachés a mano: es un
// cambio de contexto poco frecuente, y una recarga es la forma mas simple y
// robusta de garantizar que cada vista (Dashboard, Productos, Movimientos,
// Compras, Ventas, Alertas, Predicción, Reportes, Solicitudes) refleje la
// empresa recien elegida.
export function EmpresaVistaSelect() {
  const { usuario } = useAuth();
  const empresas = useAdminEmpresas();
  // Sin header X-Empresa-Vista el backend ya resuelve la propia empresa del
  // Super Admin (ver AuthMiddleware.resolverEmpresaActiva), asi que ese
  // "sin seleccion" siempre es, en la practica, una de las empresas del
  // listado -- mostrarla como "Mi empresa" aparte era un duplicado literal
  // de esa misma fila. Se preselecciona directamente esa empresa real.
  const valorActual = getEmpresaVista() ?? usuario?.empresaId ?? '';

  if (!empresas.data || empresas.data.length <= 1) return null;

  return (
    <div className={styles.wrap}>
      <Building2 size={14} className={styles.icon} aria-hidden="true" />
      <Select
        className={styles.select}
        value={valorActual}
        onChange={(e) => cambiarEmpresaVista(e.target.value || null)}
        aria-label="Empresa que estás viendo"
        title="Empresa que estás viendo (solo Super Admin)"
      >
        {empresas.data.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.razonSocial}
          </option>
        ))}
      </Select>
    </div>
  );
}
