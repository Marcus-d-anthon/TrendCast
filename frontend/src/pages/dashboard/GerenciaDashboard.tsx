import { PieChart, Repeat, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { KpiCard } from '../reportes/KpiCard';
import kpiStyles from '../reportes/ReportesPage.module.css';
import { useDashboardEjecutivo } from '../../queries/useReportes';
import { formatCurrency } from '../../utils/format';
import styles from './DashboardPage.module.css';

// Gerencia es de solo lectura en todo el sistema (ver
// backend/src/lib/permisos-matriz.ts: solo tiene "*.ver"); este aterrizaje
// refleja eso mismo en la UI -- solo KPIs y accesos directos a Reportes,
// ningun boton de accion.
export function GerenciaDashboard() {
  const dashboard = useDashboardEjecutivo();

  if (dashboard.isLoading) return <Skeleton height="20rem" />;
  if (dashboard.isError || !dashboard.data) return <ErrorState onRetry={() => dashboard.refetch()} />;

  const { valorTotalInventario, margenBrutoPromedio, rotacionInventario, ventanaRotacionDias, resumenAbc } =
    dashboard.data;

  return (
    <div className={styles.page}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Panorama general del inventario. Solo lectura — para más detalle, ve a Reportes.
      </p>

      <div className={kpiStyles.kpiGrid}>
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

      <Card>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          Reportes completos: clasificación ABC, existencias por categoría, rotación y movimientos por período.
        </p>
        <Link
          to="/reportes"
          style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}
        >
          Ver Reportes →
        </Link>
      </Card>
    </div>
  );
}
