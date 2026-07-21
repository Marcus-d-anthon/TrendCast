import { ArrowLeft, Ban, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { EstadoDocumentoComercial } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useAnularVenta, useConfirmarVenta, useVenta } from '../../queries/useVentas';
import { formatCurrency, formatDateTime } from '../../utils/format';
import styles from '../productos/ProductoDetailPage.module.css';

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

export function VentaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const puedeEditar = usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPERVISOR' || usuario?.rol === 'VENTAS';

  const venta = useVenta(id);
  const confirmar = useConfirmarVenta(id ?? '');
  const anular = useAnularVenta(id ?? '');

  const [confirmando, setConfirmando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (venta.isLoading) {
    return <Skeleton height="20rem" />;
  }

  if (venta.isError || !venta.data) {
    return <ErrorState title="No se pudo cargar la venta" onRetry={() => venta.refetch()} />;
  }

  const v = venta.data;
  const esBorrador = v.estado === 'BORRADOR';

  return (
    <div>
      <Link to="/ventas" className={styles.back}>
        <ArrowLeft size={14} aria-hidden="true" /> Volver a ventas
      </Link>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>{v.numero}</h1>
            <Badge variant={ESTADO_VARIANT[v.estado]}>{ESTADO_LABEL[v.estado]}</Badge>
          </div>
          <span className={styles.sku}>
            {v.cliente?.nombre} · {v.almacen?.nombre}
          </span>
        </div>
        {puedeEditar && esBorrador && (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setAnulando(true)}>
              <Ban size={16} aria-hidden="true" /> Anular
            </Button>
            <Button onClick={() => setConfirmando(true)}>
              <CheckCircle2 size={16} aria-hidden="true" /> Confirmar
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          {error}
        </p>
      )}

      <Card>
        <div className={styles.statGrid}>
          <div>
            <div className={styles.statLabel}>Fecha</div>
            <div className={styles.statValue}>{formatDateTime(v.fecha)}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Registrada por</div>
            <div className={styles.statValue}>{v.usuario?.nombre ?? '—'}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Subtotal</div>
            <div className={styles.statValue}>{formatCurrency(Number(v.subtotal))}</div>
          </div>
          <div>
            <div className={styles.statLabel}>IVA</div>
            <div className={styles.statValue}>{formatCurrency(Number(v.impuesto))}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Total</div>
            <div className={styles.statValue}>{formatCurrency(Number(v.total))}</div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Detalle</h2>
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th style={{ textAlign: 'right' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Precio unitario</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {v.detalle.map((linea) => (
                <tr key={linea.id}>
                  <td className={tableStyles.mono}>{linea.producto?.sku ?? '—'}</td>
                  <td>{linea.producto?.nombre ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{linea.cantidad}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(Number(linea.precioUnitario))}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(Number(linea.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {confirmando && (
        <ConfirmDialog
          title="Confirmar venta"
          message={`Al confirmar "${v.numero}" se generará un movimiento de SALIDA real por cada línea y el stock del almacén "${v.almacen?.nombre}" disminuirá de inmediato. Si el stock no alcanza, la confirmación se rechaza.`}
          confirmLabel="Confirmar venta"
          loading={confirmar.isPending}
          onClose={() => setConfirmando(false)}
          onConfirm={async () => {
            setError(null);
            try {
              await confirmar.mutateAsync();
              setConfirmando(false);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'No se pudo confirmar la venta');
              setConfirmando(false);
            }
          }}
        />
      )}

      {anulando && (
        <ConfirmDialog
          title="Anular venta"
          message={`"${v.numero}" quedará anulada. No se genera ningún movimiento de inventario.`}
          confirmLabel="Anular"
          danger
          loading={anular.isPending}
          onClose={() => setAnulando(false)}
          onConfirm={async () => {
            setError(null);
            try {
              await anular.mutateAsync();
              setAnulando(false);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'No se pudo anular la venta');
              setAnulando(false);
            }
          }}
        />
      )}
    </div>
  );
}
