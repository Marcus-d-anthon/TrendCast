import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http-client';
import type { Producto } from '../../api/types/domain';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useCategorias } from '../../queries/useCategorias';
import { useMarcas } from '../../queries/useMarcas';
import { useUnidadesMedida } from '../../queries/useUnidadesMedida';
import { useActualizarProducto, useCrearProducto } from '../../queries/useProductos';

interface ProductoFormDrawerProps {
  producto?: Producto;
  onClose: () => void;
}

export function ProductoFormDrawer({ producto, onClose }: ProductoFormDrawerProps) {
  const categorias = useCategorias();
  const marcas = useMarcas();
  const unidadesMedida = useUnidadesMedida();
  const esEdicion = Boolean(producto);

  const [sku, setSku] = useState(producto?.sku ?? '');
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId ?? '');
  const [marcaId, setMarcaId] = useState(producto?.marcaId ?? '');
  const [unidadMedidaId, setUnidadMedidaId] = useState(producto?.unidadMedidaId ?? '');
  const [precioCompra, setPrecioCompra] = useState(String(producto?.precioCompra ?? ''));
  const [precioVenta, setPrecioVenta] = useState(String(producto?.precioVenta ?? ''));
  const [stockMinimo, setStockMinimo] = useState(String(producto?.stockMinimo ?? 0));
  const [requiereLote, setRequiereLote] = useState(producto?.requiereLote ?? false);
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [error, setError] = useState<string | null>(null);

  const crear = useCrearProducto();
  const actualizar = useActualizarProducto(producto?.id ?? '');
  const guardando = crear.isPending || actualizar.isPending;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const compra = Number(precioCompra);
    const venta = Number(precioVenta);
    const minimo = Number(stockMinimo);

    try {
      if (esEdicion) {
        await actualizar.mutateAsync({
          nombre,
          descripcion: descripcion || undefined,
          categoriaId,
          marcaId,
          unidadMedidaId,
          precioCompra: compra,
          precioVenta: venta,
          stockMinimo: minimo,
          requiereLote,
          activo,
        });
      } else {
        await crear.mutateAsync({
          sku,
          nombre,
          descripcion: descripcion || undefined,
          categoriaId,
          marcaId,
          unidadMedidaId,
          precioCompra: compra,
          precioVenta: venta,
          stockMinimo: minimo,
          requiereLote,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el producto');
    }
  }

  return (
    <Drawer
      title={esEdicion ? 'Editar producto' : 'Nuevo producto'}
      subtitle={esEdicion ? producto?.sku : 'El SKU no podrá editarse luego de crear el producto.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <FormField label="SKU" htmlFor="prod-sku">
          <Input
            id="prod-sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            disabled={esEdicion}
            required
          />
        </FormField>

        <FormField label="Nombre" htmlFor="prod-nombre">
          <Input id="prod-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </FormField>

        <FormField label="Descripción" htmlFor="prod-descripcion" hint="Opcional">
          <Textarea id="prod-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </FormField>

        <FormField label="Categoría" htmlFor="prod-categoria">
          <Select id="prod-categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categorias.data?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Marca" htmlFor="prod-marca">
          <Select id="prod-marca" value={marcaId} onChange={(e) => setMarcaId(e.target.value)} required>
            <option value="" disabled>
              Selecciona una marca
            </option>
            {marcas.data?.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Unidad de medida" htmlFor="prod-unidad">
          <Select id="prod-unidad" value={unidadMedidaId} onChange={(e) => setUnidadMedidaId(e.target.value)} required>
            <option value="" disabled>
              Selecciona una unidad
            </option>
            {unidadesMedida.data?.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre} ({unidad.abreviatura})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Precio de compra (USD)" htmlFor="prod-precio-compra">
          <Input
            id="prod-precio-compra"
            type="number"
            min={0}
            step="0.01"
            value={precioCompra}
            onChange={(e) => setPrecioCompra(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Precio de venta (USD)" htmlFor="prod-precio-venta">
          <Input
            id="prod-precio-venta"
            type="number"
            min={0}
            step="0.01"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Stock mínimo" htmlFor="prod-stock-minimo" hint="Umbral para las alertas de reabastecimiento">
          <Input
            id="prod-stock-minimo"
            type="number"
            min={0}
            step="1"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Requiere lote" htmlFor="prod-requiere-lote" hint="Activa el control de lotes y fecha de vencimiento">
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              id="prod-requiere-lote"
              type="checkbox"
              checked={requiereLote}
              onChange={(e) => setRequiereLote(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Este producto se controla por lote
          </label>
        </FormField>

        {esEdicion && (
          <FormField label="Estado" htmlFor="prod-activo">
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                id="prod-activo"
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Producto activo
            </label>
          </FormField>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
