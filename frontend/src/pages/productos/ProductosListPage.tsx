import { Package, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Producto } from '../../api/types/domain';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useCategorias } from '../../queries/useCategorias';
import { useProductos } from '../../queries/useProductos';
import { formatCurrency, formatNumber } from '../../utils/format';
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
  const { usuario } = useAuth();
  const puedeEscribir = usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPERVISOR';
  const navigate = useNavigate();

  const productos = useProductos();
  const categorias = useCategorias();

  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [creando, setCreando] = useState(false);

  const filtrados = useMemo(() => {
    if (!productos.data) return [];
    const termino = busqueda.trim().toLowerCase();
    return productos.data.filter((producto) => {
      const coincideTexto =
        !termino || producto.nombre.toLowerCase().includes(termino) || producto.sku.toLowerCase().includes(termino);
      const coincideCategoria = !categoriaId || producto.categoriaId === categoriaId;
      return coincideTexto && coincideCategoria;
    });
  }, [productos.data, busqueda, categoriaId]);

  return (
    <div>
      <div className={tableStyles.toolbar}>
        <div className={tableStyles.filters}>
          <Input
            className={tableStyles.searchInput}
            placeholder="Buscar por nombre o SKU…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar productos"
          />
          <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            {categorias.data?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
        </div>
        {puedeEscribir && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} aria-hidden="true" /> Nuevo producto
          </Button>
        )}
      </div>

      <Card>
        {productos.isLoading && <Skeleton height="16rem" />}
        {productos.isError && <ErrorState onRetry={() => productos.refetch()} />}
        {productos.data && filtrados.length === 0 && (
          <EmptyState
            icon={Search}
            title="Sin resultados"
            description="Ningún producto coincide con la búsqueda o el filtro aplicado."
          />
        )}
        {productos.data && productos.data.length === 0 && (
          <EmptyState icon={Package} title="Sin productos" description="Crea el primer producto del catálogo." />
        )}
        {filtrados.length > 0 && (
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
                {filtrados.map((producto) => {
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
      </Card>

      {creando && <ProductoFormDrawer onClose={() => setCreando(false)} />}
    </div>
  );
}
