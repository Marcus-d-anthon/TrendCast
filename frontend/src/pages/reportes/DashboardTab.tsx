import { PieChart, Repeat, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { paginar, Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useDashboardEjecutivo } from '../../queries/useReportes';
import { formatCurrency } from '../../utils/format';
import { KpiCard } from './KpiCard';
import styles from './ReportesPage.module.css';

const BADGE_POR_CLASE = { A: 'success', B: 'warning', C: 'neutral' } as const;
const COLOR_POR_CLASE = { A: 'var(--color-success)', B: 'var(--color-accent)', C: 'var(--color-border-strong)' } as const;

export function DashboardTab() {
  const dashboard = useDashboardEjecutivo();
  const [pagina, setPagina] = useState(1);

  if (dashboard.isLoading) return <Skeleton height="24rem" />;
  if (dashboard.isError || !dashboard.data) return <ErrorState onRetry={() => dashboard.refetch()} />;

  const { valorTotalInventario, totalProductos, margenBrutoPromedio, rotacionInventario, ventanaRotacionDias, curvaAbc, resumenAbc } =
    dashboard.data;
  const totalPaginas = Math.max(1, Math.ceil(curvaAbc.length / 10));
  const filasPagina = paginar(curvaAbc, pagina);

  return (
    <div>
      <div className={styles.kpiGrid}>
        <KpiCard icon={Wallet} label="Valor de inventario" value={formatCurrency(valorTotalInventario)} acento="primary" />
        <KpiCard
          icon={TrendingUp}
          label="Margen bruto promedio"
          value={`${(margenBrutoPromedio * 100).toFixed(1)}%`}
          acento="success"
        />
        <KpiCard
          icon={Repeat}
          label={`Rotación (${ventanaRotacionDias}d)`}
          value={`${rotacionInventario.toFixed(2)}×`}
          hint={`Unidades vendidas ÷ en stock, últimos ${ventanaRotacionDias} días`}
          acento="info"
        />
        <KpiCard
          icon={PieChart}
          label="Curva ABC"
          value={
            <>
              <Badge variant="success">{resumenAbc.A} A</Badge> <Badge variant="warning">{resumenAbc.B} B</Badge>{' '}
              <Badge variant="neutral">{resumenAbc.C} C</Badge>
            </>
          }
          acento="warning"
        />
      </div>

      <Card className={styles.sectionGap}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Clasificación ABC por valor de inventario</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          Productos ordenados por valor total en stock. Clase A concentra el 80% del valor, B el siguiente 15%, C el resto —
          criterio estándar de clasificación ABC. {totalProductos} productos analizados.
        </p>

        <div className={styles.abcBar} role="img" aria-label={`Clase A: ${resumenAbc.A} productos, Clase B: ${resumenAbc.B}, Clase C: ${resumenAbc.C}`}>
          {(['A', 'B', 'C'] as const).map((clase) => {
            const cantidad = resumenAbc[clase];
            if (cantidad === 0) return null;
            return (
              <div
                key={clase}
                className={styles.abcSegment}
                style={{ flexGrow: cantidad, background: COLOR_POR_CLASE[clase] }}
                title={`Clase ${clase}: ${cantidad} productos`}
              />
            );
          })}
        </div>

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
              {filasPagina.map((item) => (
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

        {curvaAbc.length > 10 && (
          <Pagination pagina={pagina} totalPaginas={totalPaginas} totalItems={curvaAbc.length} onCambiarPagina={setPagina} />
        )}
      </Card>
    </div>
  );
}
