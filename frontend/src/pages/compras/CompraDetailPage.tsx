import { ArrowLeft, Ban, CheckCircle2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { EstadoDocumentoComercial } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { usePermiso } from '../../auth/usePermiso';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { toast } from '../../components/ui/toast';
import { DevolucionFormDrawer } from '../devoluciones/DevolucionFormDrawer';
import { useDevolucionesDeDocumento } from '../../queries/useDevoluciones';
import { useAnularCompra, useCompra, useConfirmarCompra } from '../../queries/useCompras';
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

export function CompraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const puedeEditar = usePermiso('compras.editar');
  const puedeDevolver = usePermiso('devoluciones.crear');

  const compra = useCompra(id);
  const confirmar = useConfirmarCompra(id ?? '');
  const anular = useAnularCompra(id ?? '');
  const devoluciones = useDevolucionesDeDocumento({ compraId: id });

  const [confirmando, setConfirmando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [registrandoDevolucion, setRegistrandoDevolucion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (compra.isLoading) {
    return <Skeleton height="20rem" />;
  }

  if (compra.isError || !compra.data) {
    return <ErrorState title="No se pudo cargar la compra" onRetry={() => compra.refetch()} />;
  }

  const c = compra.data;
  const esBorrador = c.estado === 'BORRADOR';

  return (
    <div>
      <Link to="/compras" className={styles.back}>
        <ArrowLeft size={14} aria-hidden="true" /> Volver a compras
      </Link>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>{c.numero}</h1>
            <Badge variant={ESTADO_VARIANT[c.estado]}>{ESTADO_LABEL[c.estado]}</Badge>
          </div>
          <span className={styles.sku}>
            {c.proveedor?.razonSocial} · {c.almacen?.nombre}
          </span>
        </div>
        {((puedeEditar && esBorrador) || (puedeDevolver && c.estado === 'CONFIRMADA')) && (
          <div className={styles.actions}>
            {puedeEditar && esBorrador && (
              <>
                <Button variant="secondary" onClick={() => setAnulando(true)}>
                  <Ban size={16} aria-hidden="true" /> Anular
                </Button>
                <Button onClick={() => setConfirmando(true)}>
                  <CheckCircle2 size={16} aria-hidden="true" /> Confirmar
                </Button>
              </>
            )}
            {puedeDevolver && c.estado === 'CONFIRMADA' && (
              <Button variant="secondary" onClick={() => setRegistrandoDevolucion(true)}>
                <Undo2 size={16} aria-hidden="true" /> Registrar devolución
              </Button>
            )}
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
            <div className={styles.statValue}>{formatDateTime(c.fecha)}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Registrada por</div>
            <div className={styles.statValue}>{c.usuario?.nombre ?? '—'}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Subtotal</div>
            <div className={styles.statValue}>{formatCurrency(Number(c.subtotal))}</div>
          </div>
          <div>
            <div className={styles.statLabel}>IVA</div>
            <div className={styles.statValue}>{formatCurrency(Number(c.impuesto))}</div>
          </div>
          <div>
            <div className={styles.statLabel}>Total</div>
            <div className={styles.statValue}>{formatCurrency(Number(c.total))}</div>
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
              {c.detalle.map((linea) => (
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

      {devoluciones.data && devoluciones.data.length > 0 && (
        <Card>
          <h2 className={styles.sectionTitle}>Devoluciones registradas</h2>
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Cantidad total</th>
                </tr>
              </thead>
              <tbody>
                {devoluciones.data.map((dev) => (
                  <tr key={dev.id}>
                    <td className={tableStyles.mono}>{dev.numero}</td>
                    <td>{formatDateTime(dev.fecha)}</td>
                    <td>
                      <Badge variant={ESTADO_VARIANT[dev.estado]}>{ESTADO_LABEL[dev.estado]}</Badge>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {dev.detalle.reduce((suma, linea) => suma + linea.cantidad, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {registrandoDevolucion && (
        <DevolucionFormDrawer tipo="PROVEEDOR" documento={c} onClose={() => setRegistrandoDevolucion(false)} />
      )}

      {confirmando && (
        <ConfirmDialog
          title="Confirmar compra"
          message={`Al confirmar "${c.numero}" se generará un movimiento de ENTRADA real por cada línea y el stock del almacén "${c.almacen?.nombre}" aumentará de inmediato.`}
          confirmLabel="Confirmar compra"
          loading={confirmar.isPending}
          onClose={() => setConfirmando(false)}
          onConfirm={async () => {
            setError(null);
            try {
              await confirmar.mutateAsync();
              toast.success('Compra confirmada: stock actualizado');
              setConfirmando(false);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'No se pudo confirmar la compra');
              setConfirmando(false);
            }
          }}
        />
      )}

      {anulando && (
        <ConfirmDialog
          title="Anular compra"
          message={`"${c.numero}" quedará anulada. No se genera ningún movimiento de inventario.`}
          confirmLabel="Anular"
          danger
          loading={anular.isPending}
          onClose={() => setAnulando(false)}
          onConfirm={async () => {
            setError(null);
            try {
              await anular.mutateAsync();
              toast.success('Compra anulada');
              setAnulando(false);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'No se pudo anular la compra');
              setAnulando(false);
            }
          }}
        />
      )}
    </div>
  );
}
