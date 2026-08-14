import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '../../components/ui/Card';
import styles from './KpiCard.module.css';

type Acento = 'primary' | 'info' | 'success' | 'warning';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  acento?: Acento;
}

export function KpiCard({ icon: Icon, label, value, hint, acento = 'primary' }: KpiCardProps) {
  return (
    <Card className={styles.card}>
      <div className={`${styles.iconBadge} ${styles[acento]}`}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className={styles.body}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {hint && <div className={styles.hint}>{hint}</div>}
      </div>
    </Card>
  );
}
