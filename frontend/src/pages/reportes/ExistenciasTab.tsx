import { reportesApi } from '../../api/endpoints/reportes';
import { CategoryValueChart } from '../../components/charts/CategoryValueChart';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { ExportButtons } from '../../components/ui/ExportButtons';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useExistencias } from '../../queries/useReportes';
import { formatCurrency, formatNumber } from '../../utils/format';
import styles from './ReportesPage.module.css';

export function ExistenciasTab() {
  const existencias = useExistencias();

  if (existencias.isLoading) return <Skeleton height="20rem" />;
  if (existencias.isError || !existencias.data) return <ErrorState onRetry={() => existencias.refetch()} />;

  const { totalProductos, totalUnidades, valorTotalInventario, detalle } = existencias.data;

  return (
    <div>
      <ExportButtons onExportar={(formato) => reportesApi.exportarExistencias(formato)} />

      <div className={styles.kpiGrid}>
        <Card>
          <div className={styles.kpiLabel}>Productos activos</div>
          <div className={styles.kpiValue}>{formatNumber(totalProductos)}</div>
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Unidades totales</div>
          <div className={styles.kpiValue}>{formatNumber(totalUnidades)}</div>
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Valor de inventario</div>
          <div className={styles.kpiValue}>{formatCurrency(valorTotalInventario)}</div>
        </Card>
      </div>

      <Card>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Valor de inventario por categoría</h2>
        <CategoryValueChart detalle={detalle} />
      </Card>

      <Card className={styles.sectionGap}>
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'right' }}>Valor total</th>
              </tr>
            </thead>
            <tbody>
              {detalle.map((item) => (
                <tr key={item.productoId}>
                  <td className={tableStyles.mono}>{item.sku}</td>
                  <td>{item.nombre}</td>
                  <td>{item.categoria}</td>
                  <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                    {formatNumber(item.cantidad)}
                  </td>
                  <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                    {formatCurrency(item.precioUnitario)}
                  </td>
                  <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                    {formatCurrency(item.valorTotal)}
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
