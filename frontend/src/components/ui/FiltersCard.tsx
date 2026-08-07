import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './Card';
import styles from './FiltersCard.module.css';

interface FiltersCardProps {
  children: ReactNode;
  actions?: ReactNode;
}

/** Envoltorio visual unico para toda barra de filtros: mismo card, mismo grid, en toda la app. */
export function FiltersCard({ children, actions }: FiltersCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>
          <SlidersHorizontal size={14} aria-hidden="true" /> Filtros
        </span>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.grid}>{children}</div>
    </Card>
  );
}
