import { useState, type FormEvent } from 'react';
import type { TipoMovimiento } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { toast } from '../../components/ui/toast';
import { useAlmacenes } from '../../queries/useAlmacenes';
import { useProductos } from '../../queries/useProductos';
import { useMovimientos, useRegistrarMovimiento } from '../../queries/useMovimientos';
import { formatDateTime } from '../../utils/format';

interface RegistrarMovimientoDrawerProps {
  productoIdInicial?: string;
  onClose: () => void;
}

type TipoRegistrable = Exclude<TipoMovimiento, 'TRANSFERENCIA'>;

const TIPOS: { value: TipoRegistrable; label: string }[] = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SALIDA', label: 'Salida' },
  { value: 'AJUSTE', label: 'Ajuste (corrección)' },
];

export function RegistrarMovimientoDrawer({ productoIdInicial, onClose }: RegistrarMovimientoDrawerProps) {
  const productos = useProductos();
  const almacenes = useAlmacenes();
  const registrar = useRegistrarMovimiento();

  const [productoId, setProductoId] = useState(productoIdInicial ?? '');
  const [almacenId, setAlmacenId] = useState('');
  const [tipo, setTipo] = useState<TipoRegistrable>('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [referencia, setReferencia] = useState('');
  const [motivo, setMotivo] = useState('');
  const [movimientoOrigenId, setMovimientoOrigenId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const historialProducto = useMovimientos({ productoId, almacenId: almacenId || undefined });
  const esAjuste = tipo === 'AJUSTE';

  const productoSeleccionado = productos.data?.find((p) => p.id === productoId);
  const stockEnAlmacen = productoSeleccionado?.stocks?.find((s) => s.almacenId === almacenId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await registrar.mutateAsync({
        productoId,
        almacenId,
        tipo,
        cantidad: Number(cantidad),
        referencia: referencia || undefined,
        motivo: motivo || undefined,
        movimientoOrigenId: esAjuste ? movimientoOrigenId : undefined,
      });
      toast.success('Movimiento registrado');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el movimiento');
    }
  }

  return (
    <Drawer title="Registrar movimiento" subtitle="Queda escrito de forma permanente en el libro de inventario." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <FormField label="Producto" htmlFor="mov-producto">
          <Select
            id="mov-producto"
            value={productoId}
            onChange={(e) => {
              setProductoId(e.target.value);
              setMovimientoOrigenId('');
            }}
            required
          >
            <option value="" disabled>
              Selecciona un producto
            </option>
            {productos.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} · {p.nombre}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Almacén" htmlFor="mov-almacen">
          <Select id="mov-almacen" value={almacenId} onChange={(e) => setAlmacenId(e.target.value)} required>
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

        {productoSeleccionado && almacenId && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '-0.75rem', marginBottom: 'var(--space-4)' }}>
            Stock actual en este almacén: {stockEnAlmacen?.cantidad ?? 0} {productoSeleccionado.unidadMedida?.abreviatura ?? ''}
          </p>
        )}

        <FormField label="Tipo de movimiento" htmlFor="mov-tipo">
          <Select id="mov-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoRegistrable)} required>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label={esAjuste ? 'Saldo correcto (nuevo valor absoluto)' : 'Cantidad'}
          htmlFor="mov-cantidad"
          hint={esAjuste ? 'El ajuste fija el saldo a este valor, no lo suma ni lo resta.' : undefined}
        >
          <Input
            id="mov-cantidad"
            type="number"
            min={1}
            step="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </FormField>

        {esAjuste && (
          <FormField label="Movimiento que corrige" htmlFor="mov-origen" hint="Solo se listan movimientos del producto seleccionado">
            <Select
              id="mov-origen"
              value={movimientoOrigenId}
              onChange={(e) => setMovimientoOrigenId(e.target.value)}
              required
              disabled={!productoId}
            >
              <option value="" disabled>
                Selecciona el movimiento original
              </option>
              {historialProducto.data
                ?.filter((m) => m.tipo !== 'AJUSTE')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.tipo} · {m.cantidad} · {formatDateTime(m.fecha)}
                  </option>
                ))}
            </Select>
          </FormField>
        )}

        <FormField label="Referencia" htmlFor="mov-referencia" hint="Opcional: número de factura, guía, etc.">
          <Input id="mov-referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </FormField>

        <FormField label="Motivo" htmlFor="mov-motivo" hint="Opcional">
          <Input id="mov-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={registrar.isPending}>
            {registrar.isPending ? 'Registrando…' : 'Registrar movimiento'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
