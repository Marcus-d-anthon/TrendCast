import { useState } from 'react';
import type { Granularidad } from '../../api/types/domain';
import { PeriodStackedChart } from '../../components/charts/PeriodStackedChart';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMovimientosPorPeriodo } from '../../queries/useReportes';
import styles from './ReportesPage.module.css';

export function MovimientosPorPeriodoTab() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [granularidad, setGranularidad] = useState<Granularidad>('mensual');

  const datos = useMovimientosPorPeriodo({ desde: desde || undefined, hasta: hasta || undefined, granularidad });

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
        <Select
          className={styles.filterInput}
          value={granularidad}
          onChange={(e) => setGranularidad(e.target.value as Granularidad)}
          aria-label="Granularidad"
        >
          <option value="diaria">Diaria</option>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
        </Select>
      </div>

      <Card>
        {datos.isLoading && <Skeleton height="20rem" />}
        {datos.isError && <ErrorState onRetry={() => datos.refetch()} />}
        {datos.data && datos.data.length === 0 && (
          <EmptyState title="Sin movimientos" description="No hay movimientos en el rango seleccionado." />
        )}
        {datos.data && datos.data.length > 0 && (
          <>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Movimientos por período</h2>
            <PeriodStackedChart datos={datos.data} granularidad={granularidad} />
          </>
        )}
      </Card>
    </div>
  );
}
