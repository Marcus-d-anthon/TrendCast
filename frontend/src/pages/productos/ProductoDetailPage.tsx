import { ArrowLeft, Pencil, TrendingUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePermiso } from '../../auth/usePermiso';
import { useAuth } from '../../auth/useAuth';
import { ApiError } from '../../api/http-client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from '../../components/ui/toast';
import { AuditoriaHistorial } from '../../components/auditoria/AuditoriaHistorial';
import { MiniTape } from '../../components/ledger/MiniTape';
import { useEliminarProducto, useProducto } from '../../queries/useProductos';
import { useMovimientos } from '../../queries/useMovimientos';
import { formatCurrency, formatNumber } from '../../utils/format';
import { ProductoFormDrawer } from './ProductoFormDrawer';
import { stockTotal } from './ProductosListPage';
import styles from './ProductoDetailPage.module.css';

export function ProductoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const puedeEscribir = usePermiso('productos.editar');
  // El visor de auditoria es un panel de supervision (mismo criterio que el
  // backend, ver AuditoriaRoutes.ts): no depende de la matriz de permisos.
  const puedeVerAuditoria = usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPERVISOR' || usuario?.rol === 'SUPERUSUARIO';

  const producto = useProducto(id);
  const movimientos = useMovimientos({ productoId: id });
  const eliminar = useEliminarProducto();

  const [editando, setEditando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  if (producto.isLoading) {
    return <Skeleton height="20rem" />;
  }

  if (producto.isError || !producto.data) {
    return <ErrorState title="No se pudo cargar el producto" onRetry={() => producto.refetch()} />;
  }

  const p = producto.data;
  const cantidad = stockTotal(p);

  return (
    <div>
      <Link to="/productos" className={styles.back}>
        <ArrowLeft size={14} aria-hidden="true" /> Volver a productos
      </Link>

      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>{p.nombre}</h1>
            <Badge variant={p.activo ? 'success' : 'neutral'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
          </div>
          <span className={styles.sku}>
            {p.sku} · {p.categoria?.nombre}
          </span>
        </div>
        {puedeEscribir && (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setEditando(true)}>
              <Pencil size={16} aria-hidden="true" /> Editar
            </Button>
            <Button variant="danger" onClick={() => setConfirmandoBaja(true)}>
              <Trash2 size={16} aria-hidden="true" /> Dar de baja
            </Button>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <Card>
          <div className={styles.statGrid}>
            <div>
              <div className={styles.statLabel}>Stock actual</div>
              <div className={styles.statValue}>{formatNumber(cantidad)}</div>
            </div>
            <div>
              <div className={styles.statLabel}>Stock mínimo</div>
              <div className={styles.statValue}>{formatNumber(p.stockMinimo)}</div>
            </div>
            <div>
              <div className={styles.statLabel}>Precio compra</div>
              <div className={styles.statValue}>{formatCurrency(Number(p.precioCompra))}</div>
            </div>
            <div>
              <div className={styles.statLabel}>Precio venta</div>
              <div className={styles.statValue}>{formatCurrency(Number(p.precioVenta))}</div>
            </div>
            <div>
              <div className={styles.statLabel}>Unidad de medida</div>
              <div className={styles.statValue}>{p.unidadMedida?.abreviatura ?? '—'}</div>
            </div>
            <div>
              <div className={styles.statLabel}>Marca</div>
              <div className={styles.statValue}>{p.marca?.nombre ?? '—'}</div>
            </div>
          </div>

          {p.stocks && p.stocks.length > 0 && (
            <div className={styles.warehouseStocks}>
              <div className={styles.statLabel}>Stock por almacén</div>
              <ul className={styles.warehouseList}>
                {p.stocks.map((stock) => (
                  <li key={stock.id}>
                    <span>{stock.almacen?.nombre ?? '—'}</span>
                    <span className={styles.warehouseQty}>{formatNumber(stock.cantidad)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.descripcion && <p className={styles.description}>{p.descripcion}</p>}

          <Link to={`/prediccion?producto=${p.id}`} className={styles.predictionLink}>
            <TrendingUp size={16} aria-hidden="true" /> Ver proyección de demanda
          </Link>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Movimientos de este producto</h2>
          {movimientos.isLoading && <Skeleton height="10rem" />}
          {movimientos.isError && <ErrorState onRetry={() => movimientos.refetch()} />}
          {movimientos.data && movimientos.data.length === 0 && (
            <EmptyState title="Sin movimientos" description="Aún no se ha registrado ningún movimiento para este producto." />
          )}
          {movimientos.data && movimientos.data.length > 0 && (
            <MiniTape movimientos={movimientos.data.slice(0, 10)} />
          )}
        </Card>

        {puedeVerAuditoria && (
          <Card>
            <h2 className={styles.sectionTitle}>Historial de auditoría</h2>
            <AuditoriaHistorial entidad="Producto" registroId={p.id} />
          </Card>
        )}
      </div>

      {editando && <ProductoFormDrawer producto={p} onClose={() => setEditando(false)} />}
      {confirmandoBaja && (
        <ConfirmDialog
          title="Dar de baja producto"
          message={`"${p.nombre}" dejará de estar disponible para nuevos movimientos. El historial se conserva (baja lógica).`}
          confirmLabel="Dar de baja"
          danger
          loading={eliminar.isPending}
          onClose={() => setConfirmandoBaja(false)}
          onConfirm={async () => {
            try {
              await eliminar.mutateAsync(p.id);
              toast.success('Producto dado de baja');
              navigate('/productos');
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'No se pudo dar de baja el producto');
            }
          }}
        />
      )}
    </div>
  );
}
