import styles from './DemandForecastChart.module.css';

interface ChartTooltipEntry {
  color: string;
  label: string;
  value: string;
}

interface ChartTooltipProps {
  active?: boolean;
  title?: string | number;
  entries: ChartTooltipEntry[];
}

// Tooltip compartido por los graficos de Reportes: reusa las clases de
// DemandForecastChart.module.css (mismo lenguaje visual en todos los charts).
export function ChartTooltip({ active, title, entries }: ChartTooltipProps) {
  if (!active) return null;

  return (
    <div className={styles.tooltip}>
      {title && <div className={styles.tooltipLabel}>{title}</div>}
      {entries.map((entry) => (
        <div className={styles.tooltipRow} key={entry.label}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          {entry.label} <span className={styles.tooltipValue}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
