import { useSearchParams } from 'react-router-dom';
import { ExistenciasTab } from './ExistenciasTab';
import { MovimientosPorPeriodoTab } from './MovimientosPorPeriodoTab';
import { RotacionTab } from './RotacionTab';
import styles from './ReportesPage.module.css';

const TABS = [
  { value: 'existencias', label: 'Existencias' },
  { value: 'rotacion', label: 'Rotación' },
  { value: 'periodo', label: 'Movimientos por período' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export function ReportesPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabValue) ?? 'existencias';

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
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'existencias' && <ExistenciasTab />}
      {tab === 'rotacion' && <RotacionTab />}
      {tab === 'periodo' && <MovimientosPorPeriodoTab />}
    </div>
  );
}
