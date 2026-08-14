import { BookOpen, Plus, Warehouse } from 'lucide-react';
import { useState } from 'react';
import type { TipoMovimiento } from '../../api/types/domain';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { MovementTape } from '../../components/ledger/MovementTape';
import { useAlmacenes } from '../../queries/useAlmacenes';
import { useMovimientosPaginado } from '../../queries/useMovimientos';
import { useProductos } from '../../queries/useProductos';
import { rangoFechasDefecto } from '../../utils/format';
import { RegistrarMovimientoDrawer } from './RegistrarMovimientoDrawer';
import tableStyles from '../../components/ui/Table.module.css';

const RANGO_DEFECTO = rangoFechasDefecto();

export function MovimientosPage() {
  const { usuario } = useAuth();
  const sinAlmacenAsignado = usuario?.rol === 'BODEGA' && !usuario.almacenId;

  const productos = useProductos();
  const almacenes = useAlmacenes();

  const [productoId, setProductoId] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [tipo, setTipo] = useState<TipoMovimiento | ''>('');
  const [desde, setDesde] = useState(RANGO_DEFECTO.desde);
  const [hasta, setHasta] = useState(RANGO_DEFECTO.hasta);
  const [pagina, setPagina] = useState(1);
  const [registrando, setRegistrando] = useState(false);

  const movimientos = useMovimientosPaginado(
    {
      page: pagina,
      productoId: productoId || undefined,
      almacenId: almacenId || undefined,
      tipo: tipo || undefined,
      desde: desde ? `${desde}T00:00:00` : undefined,
      hasta: hasta ? `${hasta}T23:59:59` : undefined,
    },
    { enabled: !sinAlmacenAsignado }
  );

  function conFiltro<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPagina(1);
      setter(v);
    };
  }

  const filas = movimientos.data?.data ?? [];
  const meta = movimientos.data?.meta;

  if (sinAlmacenAsignado) {
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
    <div>
      <FiltersCard>
        <FormField label="Producto" htmlFor="mov-producto" hint="Acota el libro a un solo producto">
          <SearchSelect
            id="mov-producto"
            options={(productos.data ?? []).map((p) => ({ value: p.id, label: `${p.sku} · ${p.nombre}`, busqueda: p.sku }))}
            value={productoId}
            onChange={conFiltro(setProductoId)}
            placeholder="Todos los productos"
          />
        </FormField>
        <FormField label="Almacén" htmlFor="mov-almacen" hint="Filtra por bodega o punto de venta">
          <Select id="mov-almacen" value={almacenId} onChange={(e) => conFiltro(setAlmacenId)(e.target.value)}>
            <option value="">Todos los almacenes</option>
            {almacenes.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tipo" htmlFor="mov-tipo" hint="Entrada, salida, ajuste o transferencia">
          <Select
            id="mov-tipo"
            value={tipo}
            onChange={(e) => conFiltro(setTipo)(e.target.value as TipoMovimiento | '')}
          >
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </Select>
        </FormField>
        <FormField label="Fecha inicio" htmlFor="mov-desde" hint="Por defecto, 2 días atrás">
          <Input id="mov-desde" type="date" value={desde} onChange={(e) => conFiltro(setDesde)(e.target.value)} />
        </FormField>
        <FormField label="Fecha fin" htmlFor="mov-hasta" hint="Por defecto, hoy">
          <Input id="mov-hasta" type="date" value={hasta} onChange={(e) => conFiltro(setHasta)(e.target.value)} />
        </FormField>
      </FiltersCard>

      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Libro de movimientos de inventario, más reciente primero.
        </p>
        <Button onClick={() => setRegistrando(true)}>
          <Plus size={16} aria-hidden="true" /> Registrar movimiento
        </Button>
      </div>

      <Card>
        {movimientos.isLoading && <Skeleton height="20rem" />}
        {movimientos.isError && <ErrorState onRetry={() => movimientos.refetch()} />}
        {movimientos.data && filas.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="Sin movimientos"
            description="Ningún movimiento coincide con los filtros aplicados."
          />
        )}
        {filas.length > 0 && <MovementTape movimientos={filas} />}

        {meta && (
          <Pagination
            pagina={meta.page}
            totalPaginas={meta.totalPaginas}
            totalItems={meta.total}
            onCambiarPagina={setPagina}
          />
        )}
      </Card>

      {registrando && (
        <RegistrarMovimientoDrawer productoIdInicial={productoId || undefined} onClose={() => setRegistrando(false)} />
      )}
    </div>
  );
}
