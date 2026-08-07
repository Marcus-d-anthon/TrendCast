import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useDashboardEjecutivo } from '../../queries/useReportes';
import { formatCurrency } from '../../utils/format';
import styles from './ReportesPage.module.css';

const BADGE_POR_CLASE = { A: 'success', B: 'warning', C: 'neutral' } as const;

export function DashboardTab() {
  const dashboard = useDashboardEjecutivo();

  if (dashboard.isLoading) return <Skeleton height="24rem" />;
  if (dashboard.isError || !dashboard.data) return <ErrorState onRetry={() => dashboard.refetch()} />;

  const { valorTotalInventario, totalProductos, margenBrutoPromedio, rotacionInventario, ventanaRotacionDias, curvaAbc, resumenAbc } =
    dashboard.data;

  return (
    <div>
      <div className={styles.kpiGrid}>
        <Card>
          <div className={styles.kpiLabel}>Valor de inventario</div>
          <div className={styles.kpiValue}>{formatCurrency(valorTotalInventario)}</div>
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Margen bruto promedio</div>
          <div className={styles.kpiValue}>{(margenBrutoPromedio * 100).toFixed(1)}%</div>
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Rotación de inventario ({ventanaRotacionDias}d)</div>
          <div className={styles.kpiValue}>{rotacionInventario.toFixed(2)}×</div>
          <div style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Unidades vendidas ÷ unidades en stock, últimos {ventanaRotacionDias} días
          </div>
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Curva ABC</div>
          <div className={styles.kpiValue}>
            <Badge variant="success">{resumenAbc.A} A</Badge> <Badge variant="warning">{resumenAbc.B} B</Badge>{' '}
            <Badge variant="neutral">{resumenAbc.C} C</Badge>
          </div>
        </Card>
      </div>

      <Card className={styles.sectionGap}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Clasificación ABC por valor de inventario</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          Productos ordenados por valor total en stock. Clase A concentra el 80% del valor, B el siguiente 15%, C el resto —
          criterio estándar de clasificación ABC. {totalProductos} productos analizados.
        </p>
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th style={{ textAlign: 'right' }}>Valor total</th>
                <th style={{ textAlign: 'right' }}>% acumulado</th>
                <th>Clase</th>
              </tr>
            </thead>
            <tbody>
              {curvaAbc.map((item) => (
                <tr key={item.productoId}>
                  <td className={tableStyles.mono}>{item.sku ?? '—'}</td>
                  <td>{item.nombre ?? '—'}</td>
                  <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                    {formatCurrency(item.valorTotal)}
                  </td>
                  <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                    {(item.porcentajeAcumulado * 100).toFixed(1)}%
                  </td>
                  <td>
                    <Badge variant={BADGE_POR_CLASE[item.clase]}>{item.clase}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
