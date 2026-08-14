import { useState } from 'react';
import type { Granularidad } from '../../api/types/domain';
import { PeriodStackedChart } from '../../components/charts/PeriodStackedChart';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMovimientosPorPeriodo } from '../../queries/useReportes';
import { rangoFechasDefecto } from '../../utils/format';

const RANGO_DEFECTO = rangoFechasDefecto();

export function MovimientosPorPeriodoTab() {
  const [desde, setDesde] = useState(RANGO_DEFECTO.desde);
  const [hasta, setHasta] = useState(RANGO_DEFECTO.hasta);
  const [granularidad, setGranularidad] = useState<Granularidad>('mensual');

  const datos = useMovimientosPorPeriodo({ desde: desde || undefined, hasta: hasta || undefined, granularidad });

  return (
    <div>
      <FiltersCard>
        <FormField label="Fecha inicio" htmlFor="per-desde" hint="Por defecto, 2 días atrás">
          <Input id="per-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </FormField>
        <FormField label="Fecha fin" htmlFor="per-hasta" hint="Por defecto, hoy">
          <Input id="per-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </FormField>
        <FormField label="Granularidad" htmlFor="per-gran" hint="Agrupa los movimientos por día, semana o mes">
          <Select id="per-gran" value={granularidad} onChange={(e) => setGranularidad(e.target.value as Granularidad)}>
            <option value="diaria">Diaria</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </Select>
        </FormField>
      </FiltersCard>

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
