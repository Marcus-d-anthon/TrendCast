import { useSearchParams } from 'react-router-dom';
import type { Granularidad } from '../../api/types/domain';
import { DemandForecastChart } from '../../components/charts/DemandForecastChart';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { usePrediccion } from '../../queries/usePrediccion';
import { useProductos } from '../../queries/useProductos';
import { formatNumber } from '../../utils/format';
import styles from './PrediccionPage.module.css';

const GRANULARIDADES: { value: Granularidad; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'diaria', label: 'Diaria' },
];

export function PrediccionPage() {
  const [params, setParams] = useSearchParams();
  const productoId = params.get('producto') ?? '';
  const periodos = Number(params.get('periodos') ?? 6);
  const granularidad = (params.get('granularidad') as Granularidad) ?? 'mensual';

  const productos = useProductos();
  const prediccion = usePrediccion(productoId || undefined, { periodos, granularidad });

  function actualizarParam(clave: string, valor: string) {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    setParams(siguiente, { replace: true });
  }

  return (
    <div>
      <div className={styles.controls}>
        <Select
          className={styles.controlInput}
          value={productoId}
          onChange={(e) => actualizarParam('producto', e.target.value)}
          aria-label="Producto"
        >
          <option value="">Selecciona un producto</option>
          {productos.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} · {p.nombre}
            </option>
          ))}
        </Select>
        <Select
          className={styles.narrowInput}
          value={granularidad}
          onChange={(e) => actualizarParam('granularidad', e.target.value)}
          aria-label="Granularidad"
        >
          {GRANULARIDADES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        <Select
          className={styles.narrowInput}
          value={String(periodos)}
          onChange={(e) => actualizarParam('periodos', e.target.value)}
          aria-label="Períodos"
        >
          {[3, 6, 12, 24].map((n) => (
            <option key={n} value={n}>
              Últimos {n} períodos
            </option>
          ))}
        </Select>
      </div>

      {!productoId && (
        <Card>
          <EmptyState title="Selecciona un producto" description="Elige un producto para ver su proyección de demanda." />
        </Card>
      )}

      {productoId && prediccion.isLoading && <Skeleton height="24rem" />}
      {productoId && prediccion.isError && <ErrorState onRetry={() => prediccion.refetch()} />}

      {productoId && prediccion.data && (
        <div className={styles.grid}>
          <Card>
            <h2 style={{ marginBottom: 'var(--space-1)' }}>{prediccion.data.nombre}</h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              {prediccion.data.sku}
            </p>
            {prediccion.data.historico.length === 0 ? (
              <EmptyState title="Sin historial de salidas" description="Este producto todavía no tiene movimientos de tipo SALIDA para proyectar." />
            ) : (
              <DemandForecastChart prediccion={prediccion.data} />
            )}
          </Card>

          <div>
            <div className={styles.recommendationCard}>
              <div className={styles.recommendationLabel}>Recomendación de reabastecimiento</div>
              <div className={styles.recommendationValue}>{formatNumber(prediccion.data.recomendacionReabastecimiento)} unidades</div>
              <div className={styles.recommendationHint}>
                Cubre la demanda proyectada + stock mínimo, descontando el stock actual.
              </div>
            </div>

            <Card className={styles.statCard}>
              <div className={styles.statLabel}>Promedio móvil (ventana {prediccion.data.promedioMovil.ventana})</div>
              <div className={styles.statValue}>{formatNumber(Math.round(prediccion.data.promedioMovil.proyeccionProximoPeriodo))}</div>
              <div className={styles.statHint}>Proyección del próximo período por promedio simple</div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statLabel}>Regresión lineal</div>
              <div className={styles.statValue}>{formatNumber(Math.round(prediccion.data.regresionLineal.proyeccionProximoPeriodo))}</div>
              <div className={styles.statHint}>
                Pendiente {prediccion.data.regresionLineal.pendienteB >= 0 ? '+' : ''}
                {prediccion.data.regresionLineal.pendienteB.toFixed(2)} por período
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statLabel}>Stock actual vs. mínimo</div>
              <div className={styles.statValue}>
                {formatNumber(prediccion.data.stockActual)} / {formatNumber(prediccion.data.stockMinimo)}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
