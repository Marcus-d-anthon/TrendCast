import { useState } from 'react';
import { RotationBarChart } from '../../components/charts/RotationBarChart';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useRotacion } from '../../queries/useReportes';
import { formatNumber } from '../../utils/format';
import styles from './ReportesPage.module.css';

export function RotacionTab() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const rotacion = useRotacion({ desde: desde || undefined, hasta: hasta || undefined });

  return (
    <div>
      <div className={styles.filters}>
        <Input
          type="date"
          className={styles.filterInput}
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          aria-label="Desde"
        />
        <Input
          type="date"
          className={styles.filterInput}
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          aria-label="Hasta"
        />
      </div>

      <Card>
        {rotacion.isLoading && <Skeleton height="20rem" />}
        {rotacion.isError && <ErrorState onRetry={() => rotacion.refetch()} />}
        {rotacion.data && rotacion.data.length === 0 && (
          <EmptyState title="Sin movimientos" description="No hay movimientos en el rango seleccionado." />
        )}
        {rotacion.data && rotacion.data.length > 0 && (
          <>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Entradas vs. salidas por producto</h2>
            <RotationBarChart datos={rotacion.data} />
          </>
        )}
      </Card>

      {rotacion.data && rotacion.data.length > 0 && (
        <Card className={styles.sectionGap}>
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'right' }}>Entradas</th>
                  <th style={{ textAlign: 'right' }}>Salidas</th>
                  <th style={{ textAlign: 'right' }}>Ajustes</th>
                </tr>
              </thead>
              <tbody>
                {rotacion.data.map((item) => (
                  <tr key={item.productoId}>
                    <td className={tableStyles.mono}>{item.sku ?? '—'}</td>
                    <td>{item.nombre ?? '—'}</td>
                    <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                      {formatNumber(item.entradas)}
                    </td>
                    <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                      {formatNumber(item.salidas)}
                    </td>
                    <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                      {formatNumber(item.ajustes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
