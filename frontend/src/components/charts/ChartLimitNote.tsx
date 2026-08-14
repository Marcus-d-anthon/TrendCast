import styles from './DemandForecastChart.module.css';

/** Tope de barras/series por grafico en todo el sistema (Ley de Miller). */
export const MAX_PUNTOS_GRAFICO = 10;

/** Un grafico de barras deja de leerse con demasiadas barras (Ley de Miller):
 * cada componente de chart limita sus datos y usa esta nota para avisar que
 * hay mas, en vez de intentar embutirlo todo en una sola vista. */
export function ChartLimitNote({ total, mostrados }: { total: number; mostrados: number }) {
  if (total <= mostrados) return null;
  return (
    <p className={styles.notaLimite}>
      Mostrando {mostrados} de {total} — ajusta los filtros o el rango de fechas para ver el resto.
    </p>
  );
}
