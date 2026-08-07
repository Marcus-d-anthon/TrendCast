import { Plus, ShoppingCart } from 'lucide-react';
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
import { useCompras } from '../../queries/useCompras';
import { formatCurrency, formatDate } from '../../utils/format';
import { CompraFormDrawer } from './CompraFormDrawer';

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

export function ComprasListPage() {
  const puedeCrear = usePermiso('compras.crear');
  const navigate = useNavigate();

  const compras = useCompras();
  const [creando, setCreando] = useState(false);

  return (
    <div>
      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Órdenes de compra a proveedores. Confirmar una compra genera el ingreso real de stock.
        </p>
        {puedeCrear && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} aria-hidden="true" /> Nueva compra
          </Button>
        )}
      </div>

      <Card>
        {compras.isLoading && <Skeleton height="16rem" />}
        {compras.isError && <ErrorState onRetry={() => compras.refetch()} />}
        {compras.data && compras.data.length === 0 && (
          <EmptyState icon={ShoppingCart} title="Sin compras" description="Registra la primera orden de compra." />
        )}
        {compras.data && compras.data.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Proveedor</th>
                  <th>Almacén</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {compras.data.map((compra) => (
                  <tr
                    key={compra.id}
                    className={tableStyles.clickable}
                    onClick={() => navigate(`/compras/${compra.id}`)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ver detalle de la compra ${compra.numero}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/compras/${compra.id}`);
                      }
                    }}
                  >
                    <td className={tableStyles.mono}>{compra.numero}</td>
                    <td>{compra.proveedor?.razonSocial ?? '—'}</td>
                    <td>{compra.almacen?.nombre ?? '—'}</td>
                    <td>{formatDate(compra.fecha)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(Number(compra.total))}
                    </td>
                    <td>
                      <Badge variant={ESTADO_VARIANT[compra.estado]}>{ESTADO_LABEL[compra.estado]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creando && <CompraFormDrawer onClose={() => setCreando(false)} />}
    </div>
  );
}
