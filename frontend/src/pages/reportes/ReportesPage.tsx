import { CalendarRange, LayoutDashboard, Package, Repeat } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { DashboardTab } from './DashboardTab';
import { ExistenciasTab } from './ExistenciasTab';
import { MovimientosPorPeriodoTab } from './MovimientosPorPeriodoTab';
import { RotacionTab } from './RotacionTab';
import styles from './ReportesPage.module.css';

const TABS = [
  { value: 'dashboard', label: 'Dashboard ejecutivo', icon: LayoutDashboard },
  { value: 'existencias', label: 'Existencias', icon: Package },
  { value: 'rotacion', label: 'Rotación', icon: Repeat },
  { value: 'periodo', label: 'Movimientos por período', icon: CalendarRange },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export function ReportesPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabValue) ?? 'dashboard';

  return (
    <div>
      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={tab === t.value ? styles.tabActive : styles.tab}
            onClick={() => setParams({ tab: t.value }, { replace: true })}
          >
            <t.icon size={16} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'existencias' && <ExistenciasTab />}
      {tab === 'rotacion' && <RotacionTab />}
      {tab === 'periodo' && <MovimientosPorPeriodoTab />}
    </div>
  );
}
