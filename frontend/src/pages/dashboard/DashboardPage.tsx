import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { MiniTape } from '../../components/ledger/MiniTape';
import { useAlertas } from '../../queries/useAlertas';
import { useMovimientos } from '../../queries/useMovimientos';
import { useExistencias } from '../../queries/useReportes';
import { formatCurrency, formatNumber } from '../../utils/format';
import styles from './DashboardPage.module.css';

const MOVIMIENTOS_RECIENTES = 6;
const ALERTAS_DESTACADAS = 5;

export function DashboardPage() {
  const existencias = useExistencias();
  const alertas = useAlertas();
  const movimientos = useMovimientos();

  return (
    <div className={styles.page}>
      <div className={styles.kpiGrid}>
        <Card>
          <div className={styles.kpiLabel}>Productos activos</div>
          {existencias.isLoading ? (
            <Skeleton height="2rem" width="4rem" />
          ) : (
            <div className={styles.kpiValue}>{formatNumber(existencias.data?.totalProductos ?? 0)}</div>
          )}
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Unidades en bodega</div>
          {existencias.isLoading ? (
            <Skeleton height="2rem" width="4rem" />
          ) : (
            <div className={`${styles.kpiValue} ${styles.mono}`}>
              {formatNumber(existencias.data?.totalUnidades ?? 0)}
            </div>
          )}
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Valor de inventario</div>
          {existencias.isLoading ? (
            <Skeleton height="2rem" width="6rem" />
          ) : (
            <div className={`${styles.kpiValue} ${styles.mono}`}>
              {formatCurrency(existencias.data?.valorTotalInventario ?? 0)}
            </div>
          )}
        </Card>
        <Card>
          <div className={styles.kpiLabel}>Alertas de stock</div>
          {alertas.isLoading ? (
            <Skeleton height="2rem" width="3rem" />
          ) : (
            <div className={styles.kpiValue}>{formatNumber(alertas.data?.length ?? 0)}</div>
          )}
        </Card>
      </div>

      <div className={styles.widgetGrid}>
        <Card>
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>Alertas de stock mínimo</h2>
            <Link to="/alertas" className={styles.widgetLink}>
              Ver todas
            </Link>
          </div>

          {alertas.isLoading && <Skeleton height="8rem" />}
          {alertas.isError && <ErrorState onRetry={() => alertas.refetch()} />}
          {alertas.data && alertas.data.length === 0 && (
            <EmptyState title="Sin alertas" description="Todos los productos están sobre su stock mínimo." />
          )}
          {alertas.data && alertas.data.length > 0 && (
            <div>
              {alertas.data.slice(0, ALERTAS_DESTACADAS).map((alerta) => (
                <div key={alerta.productoId} className={styles.alertRow}>
                  <div>
                    <div className={styles.alertName}>{alerta.nombre}</div>
                    <div className={styles.alertSku}>{alerta.sku}</div>
                  </div>
                  <Badge variant="danger">Faltan {alerta.unidadesFaltantes}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>Movimientos recientes</h2>
            <Link to="/movimientos" className={styles.widgetLink}>
              Ver libro completo
            </Link>
          </div>

          {movimientos.isLoading && <Skeleton height="8rem" />}
          {movimientos.isError && <ErrorState onRetry={() => movimientos.refetch()} />}
          {movimientos.data && movimientos.data.length === 0 && (
            <EmptyState title="Sin movimientos" description="Todavía no se ha registrado ningún movimiento." />
          )}
          {movimientos.data && movimientos.data.length > 0 && (
            <MiniTape movimientos={movimientos.data.slice(0, MOVIMIENTOS_RECIENTES)} />
          )}
        </Card>
      </div>
    </div>
  );
}
