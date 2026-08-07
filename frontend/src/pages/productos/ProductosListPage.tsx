import { Package, Plus, ScanBarcode, Search, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productosApi } from '../../api/endpoints/productos';
import type { Producto } from '../../api/types/domain';
import { usePermiso } from '../../auth/usePermiso';
import { Badge } from '../../components/ui/Badge';
import { BarcodeScannerModal } from '../../components/ui/BarcodeScannerModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ExportButtons } from '../../components/ui/ExportButtons';
import exportButtonsStyles from '../../components/ui/ExportButtons.module.css';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { toast } from '../../components/ui/toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useCategorias } from '../../queries/useCategorias';
import { useProductosPaginado } from '../../queries/useProductos';
import { formatCurrency, formatNumber } from '../../utils/format';
import { ImportarProductosModal } from './ImportarProductosModal';
import { ProductoFormDrawer } from './ProductoFormDrawer';
import styles from './ProductosListPage.module.css';

export function stockTotal(producto: Producto): number {
  return producto.stocks?.reduce((suma, stock) => suma + stock.cantidad, 0) ?? 0;
}

function estadoStock(producto: Producto): { label: string; variant: 'success' | 'warning' | 'danger' } {
  const cantidad = stockTotal(producto);
  if (cantidad <= 0) return { label: 'Sin stock', variant: 'danger' };
  if (cantidad <= producto.stockMinimo) return { label: 'Bajo mínimo', variant: 'warning' };
  return { label: 'Saludable', variant: 'success' };
}

export function ProductosListPage() {
  const puedeEscribir = usePermiso('productos.crear');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const busquedaCruda = params.get('q') ?? '';
  const categoriaId = params.get('categoria') ?? '';
  const pagina = Number(params.get('pagina') ?? 1);
  const busqueda = useDebouncedValue(busquedaCruda);

  const categorias = useCategorias();
  const productos = useProductosPaginado({ page: pagina, busqueda: busqueda || undefined, categoriaId: categoriaId || undefined });

  const [creando, setCreando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);

  function actualizarParam(clave: string, valor: string) {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    if (clave !== 'pagina') siguiente.delete('pagina');
    setParams(siguiente, { replace: true });
  }

  const filas = productos.data?.data ?? [];
  const meta = productos.data?.meta;

  return (
    <div>
      <FiltersCard
        actions={
          <Button type="button" variant="secondary" onClick={() => setEscaneando(true)}>
            <ScanBarcode size={16} aria-hidden="true" /> Escanear
          </Button>
        }
      >
        <FormField label="Buscar" htmlFor="prod-buscar" hint="Por nombre o SKU, desde 3 caracteres">
          <Input
            id="prod-buscar"
            placeholder="Ej. Omega 3, TS-NUT-003…"
            value={busquedaCruda}
            onChange={(e) => actualizarParam('q', e.target.value)}
            aria-label="Buscar productos"
          />
        </FormField>
        <FormField label="Categoría" htmlFor="prod-categoria" hint="Filtra el catálogo por categoría">
          <Select
            id="prod-categoria"
            value={categoriaId}
            onChange={(e) => actualizarParam('categoria', e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.data?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
        </FormField>
      </FiltersCard>

      <div className={styles.toolbar}>
        <ExportButtons className={exportButtonsStyles.noMargin} onExportar={(formato) => productosApi.exportar(formato)} />
        <div className={styles.toolbarActions}>
          {puedeEscribir && (
            <Button type="button" variant="secondary" onClick={() => setImportando(true)}>
              <Upload size={16} aria-hidden="true" /> Importar
            </Button>
          )}
          {puedeEscribir && (
            <Button onClick={() => setCreando(true)}>
              <Plus size={16} aria-hidden="true" /> Nuevo producto
            </Button>
          )}
        </div>
      </div>

      <Card>
        {productos.isLoading && <Skeleton height="16rem" />}
        {productos.isError && <ErrorState onRetry={() => productos.refetch()} />}
        {productos.data && filas.length === 0 && (busquedaCruda || categoriaId) && (
          <EmptyState
            icon={Search}
            title="Sin resultados"
            description="Ningún producto coincide con la búsqueda o el filtro aplicado."
          />
        )}
        {productos.data && filas.length === 0 && !busquedaCruda && !categoriaId && (
          <EmptyState icon={Package} title="Sin productos" description="Crea el primer producto del catálogo." />
        )}
        {filas.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th style={{ textAlign: 'right' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Precio venta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((producto) => {
                  const estado = estadoStock(producto);
                  return (
                    <tr
                      key={producto.id}
                      className={tableStyles.clickable}
                      onClick={() => navigate(`/productos/${producto.id}`)}
                      tabIndex={0}
                      role="link"
                      aria-label={`Ver detalle de ${producto.nombre}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/productos/${producto.id}`);
                        }
                      }}
                    >
                      <td className={styles.skuCell}>{producto.sku}</td>
                      <td className={styles.nameCell}>{producto.nombre}</td>
                      <td>{producto.categoria?.nombre ?? '—'}</td>
                      <td>{producto.marca?.nombre ?? '—'}</td>
                      <td className={styles.numericCell}>
                        {formatNumber(stockTotal(producto))} / {formatNumber(producto.stockMinimo)}
                      </td>
                      <td className={styles.numericCell}>{formatCurrency(Number(producto.precioVenta))}</td>
                      <td>
                        <Badge variant={estado.variant}>{estado.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <Pagination
            pagina={meta.page}
            totalPaginas={meta.totalPaginas}
            totalItems={meta.total}
            onCambiarPagina={(p) => actualizarParam('pagina', String(p))}
          />
        )}
      </Card>

      {creando && <ProductoFormDrawer onClose={() => setCreando(false)} />}
      {importando && <ImportarProductosModal onClose={() => setImportando(false)} />}
      {escaneando && (
        <BarcodeScannerModal
          onClose={() => setEscaneando(false)}
          onScan={(codigo) => {
            setEscaneando(false);
            actualizarParam('q', codigo);
            toast.success(`Buscando SKU "${codigo}"…`);
          }}
        />
      )}
    </div>
  );
}
