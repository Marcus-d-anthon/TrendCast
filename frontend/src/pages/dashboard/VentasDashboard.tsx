import { Receipt, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { KpiCard } from '../reportes/KpiCard';
import kpiStyles from '../reportes/ReportesPage.module.css';
import { useClientes } from '../../queries/useClientes';
import { formatNumber } from '../../utils/format';
import styles from './DashboardPage.module.css';

const CLIENTES_DESTACADOS = 8;

export function VentasDashboard() {
  const clientes = useClientes();
  const activos = clientes.data?.filter((c) => c.activo) ?? [];

  return (
    <div className={styles.page}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Tu cartera de clientes y accesos directos a Ventas.
      </p>

      <div className={kpiStyles.kpiGrid}>
        <KpiCard icon={Users} label="Clientes activos" value={formatNumber(activos.length)} acento="primary" />
      </div>

      <div className={styles.widgetGrid}>
        <Card>
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>Cartera de clientes</h2>
          </div>
          {clientes.isLoading && <Skeleton height="10rem" />}
          {clientes.isError && <ErrorState onRetry={() => clientes.refetch()} />}
          {clientes.data && clientes.data.length === 0 && (
            <EmptyState title="Sin clientes" description="Todavía no hay clientes registrados." />
          )}
          {clientes.data && clientes.data.length > 0 && (
            <div>
              {clientes.data.slice(0, CLIENTES_DESTACADOS).map((cliente) => (
                <div key={cliente.id} className={styles.alertRow}>
                  <div>
                    <div className={styles.alertName}>{cliente.nombre}</div>
                    <div className={styles.alertSku}>{cliente.numeroDocumento}</div>
                  </div>
                  <Badge variant={cliente.activo ? 'success' : 'neutral'}>{cliente.activo ? 'Activo' : 'Inactivo'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className={styles.widgetHeader}>
            <h2 className={styles.widgetTitle}>Accesos rápidos</h2>
          </div>
          <Link
            to="/ventas"
            style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}
          >
            <Receipt size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} aria-hidden="true" />
            Ir a Ventas
          </Link>
        </Card>
      </div>
    </div>
  );
}
