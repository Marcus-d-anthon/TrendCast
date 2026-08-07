import { Plus, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EstadoDocumentoComercial } from '../../api/types/domain';
import { usePermiso } from '../../auth/usePermiso';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useVentas } from '../../queries/useVentas';
import { formatCurrency, formatDate } from '../../utils/format';
import { VentaFormDrawer } from './VentaFormDrawer';

const ESTADO_VARIANT: Record<EstadoDocumentoComercial, 'success' | 'warning' | 'danger'> = {
  BORRADOR: 'warning',
  CONFIRMADA: 'success',
  ANULADA: 'danger',
};

const ESTADO_LABEL: Record<EstadoDocumentoComercial, string> = {
  BORRADOR: 'Borrador',
  CONFIRMADA: 'Confirmada',
  ANULADA: 'Anulada',
};

export function VentasListPage() {
  const puedeCrear = usePermiso('ventas.crear');
  const navigate = useNavigate();

  const ventas = useVentas();
  const [creando, setCreando] = useState(false);

  return (
    <div>
      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Ventas a clientes. Confirmar una venta genera la salida real de stock.
        </p>
        {puedeCrear && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} aria-hidden="true" /> Nueva venta
          </Button>
        )}
      </div>

      <Card>
        {ventas.isLoading && <Skeleton height="16rem" />}
        {ventas.isError && <ErrorState onRetry={() => ventas.refetch()} />}
        {ventas.data && ventas.data.length === 0 && (
          <EmptyState icon={Receipt} title="Sin ventas" description="Registra la primera venta." />
        )}
        {ventas.data && ventas.data.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Almacén</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.data.map((venta) => (
                  <tr
                    key={venta.id}
                    className={tableStyles.clickable}
                    onClick={() => navigate(`/ventas/${venta.id}`)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ver detalle de la venta ${venta.numero}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/ventas/${venta.id}`);
                      }
                    }}
                  >
                    <td className={tableStyles.mono}>{venta.numero}</td>
                    <td>{venta.cliente?.nombre ?? '—'}</td>
                    <td>{venta.almacen?.nombre ?? '—'}</td>
                    <td>{formatDate(venta.fecha)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(Number(venta.total))}
                    </td>
                    <td>
                      <Badge variant={ESTADO_VARIANT[venta.estado]}>{ESTADO_LABEL[venta.estado]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creando && <VentaFormDrawer onClose={() => setCreando(false)} />}
    </div>
  );
}
