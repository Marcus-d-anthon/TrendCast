import { useState } from 'react';
import { reportesApi } from '../../api/endpoints/reportes';
import { RotationBarChart } from '../../components/charts/RotationBarChart';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ExportButtons } from '../../components/ui/ExportButtons';
import exportButtonsStyles from '../../components/ui/ExportButtons.module.css';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { paginar, Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useRotacion } from '../../queries/useReportes';
import { formatNumber, rangoFechasDefecto } from '../../utils/format';
import styles from './ReportesPage.module.css';

const RANGO_DEFECTO = rangoFechasDefecto();

export function RotacionTab() {
  const [desde, setDesde] = useState(RANGO_DEFECTO.desde);
  const [hasta, setHasta] = useState(RANGO_DEFECTO.hasta);
  const [pagina, setPagina] = useState(1);
  const rotacion = useRotacion({ desde: desde || undefined, hasta: hasta || undefined });
  const datos = rotacion.data ?? [];
  const totalPaginas = Math.max(1, Math.ceil(datos.length / 10));
  const filasPagina = paginar(datos, pagina);

  return (
    <div>
      <FiltersCard
        actions={
          <ExportButtons
            className={exportButtonsStyles.noMargin}
            onExportar={(formato) => reportesApi.exportarRotacion(formato, { desde: desde || undefined, hasta: hasta || undefined })}
          />
        }
      >
        <FormField label="Fecha inicio" htmlFor="rot-desde" hint="Por defecto, 2 días atrás">
          <Input id="rot-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </FormField>
        <FormField label="Fecha fin" htmlFor="rot-hasta" hint="Por defecto, hoy">
          <Input id="rot-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </FormField>
      </FiltersCard>

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
                {filasPagina.map((item) => (
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

          {datos.length > 10 && (
            <Pagination pagina={pagina} totalPaginas={totalPaginas} totalItems={datos.length} onCambiarPagina={setPagina} />
          )}
        </Card>
      )}
    </div>
  );
}
