import { Boxes, Package, Wallet } from 'lucide-react';
import { useState } from 'react';
import { reportesApi } from '../../api/endpoints/reportes';
import { CategoryValueChart } from '../../components/charts/CategoryValueChart';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { ExportButtons } from '../../components/ui/ExportButtons';
import { paginar, Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useExistencias } from '../../queries/useReportes';
import { formatCurrency, formatNumber } from '../../utils/format';
import { KpiCard } from './KpiCard';
import styles from './ReportesPage.module.css';

export function ExistenciasTab() {
  const existencias = useExistencias();
  const [pagina, setPagina] = useState(1);

  if (existencias.isLoading) return <Skeleton height="20rem" />;
  if (existencias.isError || !existencias.data) return <ErrorState onRetry={() => existencias.refetch()} />;

  const { totalProductos, totalUnidades, valorTotalInventario, detalle } = existencias.data;
  const totalPaginas = Math.max(1, Math.ceil(detalle.length / 10));
  const filasPagina = paginar(detalle, pagina);

  return (
    <div>
      <ExportButtons onExportar={(formato) => reportesApi.exportarExistencias(formato)} />

      <div className={styles.kpiGrid}>
        <KpiCard icon={Package} label="Productos activos" value={formatNumber(totalProductos)} acento="primary" />
        <KpiCard icon={Boxes} label="Unidades totales" value={formatNumber(totalUnidades)} acento="info" />
        <KpiCard icon={Wallet} label="Valor de inventario" value={formatCurrency(valorTotalInventario)} acento="success" />
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
              {filasPagina.map((item) => (
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

        {detalle.length > 10 && (
          <Pagination pagina={pagina} totalPaginas={totalPaginas} totalItems={detalle.length} onCambiarPagina={setPagina} />
        )}
      </Card>
    </div>
  );
}
