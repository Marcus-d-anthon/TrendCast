import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http-client';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { toast } from '../../components/ui/toast';
import { useAlmacenes } from '../../queries/useAlmacenes';
import { useClientes } from '../../queries/useClientes';
import { useProductos } from '../../queries/useProductos';
import { useCrearVenta } from '../../queries/useVentas';
import { formatCurrency } from '../../utils/format';
import styles from '../compras/CompraFormDrawer.module.css';

interface LineaDetalle {
  productoId: string;
  cantidad: string;
  precioUnitario: string;
}

const IVA_ECUADOR = 0.15;

function lineaVacia(): LineaDetalle {
  return { productoId: '', cantidad: '1', precioUnitario: '' };
}

interface VentaFormDrawerProps {
  onClose: () => void;
}

export function VentaFormDrawer({ onClose }: VentaFormDrawerProps) {
  const navigate = useNavigate();
  const clientes = useClientes();
  const almacenes = useAlmacenes();
  const productos = useProductos();
  const crear = useCrearVenta();

  const [clienteId, setClienteId] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [lineas, setLineas] = useState<LineaDetalle[]>([lineaVacia()]);
  const [error, setError] = useState<string | null>(null);

  function actualizarLinea(index: number, cambios: Partial<LineaDetalle>) {
    setLineas((prev) => prev.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea)));
  }

  function seleccionarProducto(index: number, productoId: string) {
    const producto = productos.data?.find((p) => p.id === productoId);
    actualizarLinea(index, { productoId, precioUnitario: producto ? producto.precioVenta : '' });
  }

  const productoSeleccionadoEnAlmacen = (productoId: string) => {
    const producto = productos.data?.find((p) => p.id === productoId);
    return producto?.stocks?.find((s) => s.almacenId === almacenId);
  };

  const subtotal = lineas.reduce((suma, l) => suma + Number(l.cantidad || 0) * Number(l.precioUnitario || 0), 0);
  const impuesto = subtotal * IVA_ECUADOR;
  const total = subtotal + impuesto;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (lineas.some((l) => !l.productoId || Number(l.cantidad) <= 0)) {
      setError('Completa producto y cantidad (mayor a cero) en cada línea.');
      return;
    }

    try {
      const venta = await crear.mutateAsync({
        clienteId,
        almacenId,
        detalle: lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: Number(l.cantidad),
          precioUnitario: Number(l.precioUnitario),
        })),
      });
      toast.success('Venta registrada como borrador');
      onClose();
      navigate(`/ventas/${venta.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la venta');
    }
  }

  return (
    <Drawer title="Nueva venta" subtitle="Se crea en borrador; el stock solo cambia al confirmarla." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <FormField label="Cliente" htmlFor="venta-cliente">
          <Select id="venta-cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {clientes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Almacén de despacho" htmlFor="venta-almacen">
          <Select id="venta-almacen" value={almacenId} onChange={(e) => setAlmacenId(e.target.value)} required>
            <option value="" disabled>
              Selecciona un almacén
            </option>
            {almacenes.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </Select>
        </FormField>

        <div className={styles.detalleHeader}>
          <span>Detalle</span>
          <Button type="button" variant="secondary" size="sm" onClick={() => setLineas((prev) => [...prev, lineaVacia()])}>
            + Agregar línea
          </Button>
        </div>

        {lineas.map((linea, index) => {
          const stockDisponible = productoSeleccionadoEnAlmacen(linea.productoId);
          return (
            <div className={styles.linea} key={index}>
              <Select
                value={linea.productoId}
                onChange={(e) => seleccionarProducto(index, e.target.value)}
                aria-label={`Producto línea ${index + 1}`}
                required
              >
                <option value="" disabled>
                  Producto
                </option>
                {productos.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} · {p.nombre}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={1}
                step="1"
                value={linea.cantidad}
                onChange={(e) => actualizarLinea(index, { cantidad: e.target.value })}
                aria-label={`Cantidad línea ${index + 1}`}
                placeholder="Cant."
                className={styles.cantidadInput}
                required
              />
              <Input
                type="text"
                value={linea.precioUnitario ? formatCurrency(Number(linea.precioUnitario)) : ''}
                aria-label={`Precio unitario línea ${index + 1} (según el producto, no editable)`}
                placeholder="Precio"
                readOnly
                tabIndex={-1}
                className={styles.precioInput}
              />
              <span className={styles.lineaSubtotal}>
                {formatCurrency(Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0))}
              </span>
              <button
                type="button"
                className={styles.removeLinea}
                onClick={() => setLineas((prev) => prev.filter((_, i) => i !== index))}
                disabled={lineas.length === 1}
                aria-label={`Quitar línea ${index + 1}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
              {linea.productoId && almacenId && (
                <p style={{ gridColumn: '1 / -1', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Stock disponible en este almacén: {stockDisponible?.cantidad ?? 0}
                </p>
              )}
            </div>
          );
        })}

        <div className={styles.totales}>
          <div>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div>
            <span>IVA (15%)</span>
            <span>{formatCurrency(impuesto)}</span>
          </div>
          <div className={styles.totalFinal}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? 'Guardando…' : 'Guardar borrador'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
