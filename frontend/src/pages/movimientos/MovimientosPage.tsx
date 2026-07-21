import { BookOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import type { TipoMovimiento } from '../../api/types/domain';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { MovementTape } from '../../components/ledger/MovementTape';
import { useAlmacenes } from '../../queries/useAlmacenes';
import { useMovimientos } from '../../queries/useMovimientos';
import { useProductos } from '../../queries/useProductos';
import { RegistrarMovimientoDrawer } from './RegistrarMovimientoDrawer';
import styles from './MovimientosPage.module.css';

export function MovimientosPage() {
  const productos = useProductos();
  const almacenes = useAlmacenes();

  const [productoId, setProductoId] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [tipo, setTipo] = useState<TipoMovimiento | ''>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [registrando, setRegistrando] = useState(false);

  const movimientos = useMovimientos({
    productoId: productoId || undefined,
    almacenId: almacenId || undefined,
    tipo: tipo || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  });

  return (
    <div>
      <div className={tableStyles.toolbar}>
        <div className={tableStyles.filters}>
          <Select
            className={styles.filterInput}
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            aria-label="Filtrar por producto"
          >
            <option value="">Todos los productos</option>
            {productos.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.nombre}
              </option>
            ))}
          </Select>
          <Select
            className={styles.filterInput}
            value={almacenId}
            onChange={(e) => setAlmacenId(e.target.value)}
            aria-label="Filtrar por almacén"
          >
            <option value="">Todos los almacenes</option>
            {almacenes.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </Select>
          <Select
            className={styles.filterInput}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimiento | '')}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </Select>
          <Input
            type="date"
            className={styles.filterInput}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            aria-label="Desde"
          />
          <Input
            type="date"
            className={styles.filterInput}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            aria-label="Hasta"
          />
        </div>
        <Button onClick={() => setRegistrando(true)}>
          <Plus size={16} aria-hidden="true" /> Registrar movimiento
        </Button>
      </div>

      <Card>
        {movimientos.isLoading && <Skeleton height="20rem" />}
        {movimientos.isError && <ErrorState onRetry={() => movimientos.refetch()} />}
        {movimientos.data && movimientos.data.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="Sin movimientos"
            description="Ningún movimiento coincide con los filtros aplicados."
          />
        )}
        {movimientos.data && movimientos.data.length > 0 && <MovementTape movimientos={movimientos.data} />}
      </Card>

      {registrando && (
        <RegistrarMovimientoDrawer productoIdInicial={productoId || undefined} onClose={() => setRegistrando(false)} />
      )}
    </div>
  );
}
