import { ArrowLeftRight, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { MiniTape } from '../../components/ledger/MiniTape';
import { KpiCard } from '../reportes/KpiCard';
import kpiStyles from '../reportes/ReportesPage.module.css';
import { useAlmacenes } from '../../queries/useAlmacenes';
import { useMovimientos } from '../../queries/useMovimientos';
import styles from './DashboardPage.module.css';

const MOVIMIENTOS_RECIENTES = 8;

// Un usuario BODEGA queda atado a un unico almacen (Usuario.almacenId, ver
// backend/src/modules/movimientos/MovimientosController.ts): este dashboard
// muestra solo lo que le corresponde a el, mismo escopado que ya aplica el
// backend en las lecturas.
export function BodegaDashboard() {
  const { usuario } = useAuth();
  const almacenes = useAlmacenes();
  const movimientos = useMovimientos(
    { almacenId: usuario?.almacenId ?? undefined },
    { enabled: Boolean(usuario?.almacenId) }
  );

  const almacen = almacenes.data?.find((a) => a.id === usuario?.almacenId);

  if (!usuario?.almacenId) {
    return (
      <Card>
        <EmptyState
          icon={Warehouse}
          title="Sin almacén asignado"
          description={`Estimado "${usuario?.nombre ?? 'operador'}", aún no cuenta con un almacén asignado. Por favor contáctese con su administrador.`}
        />
      </Card>
    );
  }

  return (
    <div className={styles.page}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Tu almacén: <strong style={{ color: 'var(--color-text)' }}>{almacen?.nombre ?? '…'}</strong>
      </p>

      <div className={kpiStyles.kpiGrid}>
        <KpiCard
          icon={ArrowLeftRight}
          label="Movimientos recientes"
          value={movimientos.data ? movimientos.data.length : '—'}
          acento="primary"
        />
      </div>

      <div className={styles.widgetGrid}>
        <Card>
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>Movimientos de tu almacén</h2>
            <Link to="/movimientos" className={styles.widgetLink}>
              Ver libro completo
            </Link>
          </div>
          {movimientos.isLoading && <Skeleton height="10rem" />}
          {movimientos.isError && <ErrorState onRetry={() => movimientos.refetch()} />}
          {movimientos.data && movimientos.data.length === 0 && (
            <EmptyState title="Sin movimientos" description="Todavía no hay movimientos en tu almacén." />
          )}
          {movimientos.data && movimientos.data.length > 0 && (
            <MiniTape movimientos={movimientos.data.slice(0, MOVIMIENTOS_RECIENTES)} />
          )}
        </Card>

        <Card>
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>Accesos rápidos</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link to="/movimientos" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
              <ArrowLeftRight size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} aria-hidden="true" />
              Registrar movimiento
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
