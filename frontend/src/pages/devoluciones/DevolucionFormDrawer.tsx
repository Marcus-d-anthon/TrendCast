import { useMemo, useState, type FormEvent } from 'react';
import type { DetalleCompra, DetalleVenta, TipoDevolucion } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from '../../components/ui/toast';
import { useDevolucionesDeDocumento, useCrearDevolucion } from '../../queries/useDevoluciones';
import styles from './DevolucionFormDrawer.module.css';

interface DocumentoOrigen {
  id: string;
  numero: string;
  detalle: (DetalleVenta | DetalleCompra)[];
}

interface DevolucionFormDrawerProps {
  tipo: TipoDevolucion;
  documento: DocumentoOrigen;
  onClose: () => void;
}

interface LineaAgrupada {
  productoId: string;
  sku: string;
  nombre: string;
  cantidadOriginal: number;
}

export function DevolucionFormDrawer({ tipo, documento, onClose }: DevolucionFormDrawerProps) {
  const devolucionesPrevias = useDevolucionesDeDocumento(
    tipo === 'CLIENTE' ? { ventaId: documento.id } : { compraId: documento.id }
  );
  const crear = useCrearDevolucion();

  const [motivo, setMotivo] = useState('');
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // El detalle del documento origen puede repetir el mismo producto en mas de
  // una linea (p.ej. dos entregas parciales) -- se agrupa por producto para
  // mostrar y validar un solo limite disponible por producto.
  const lineas = useMemo<LineaAgrupada[]>(() => {
    const mapa = new Map<string, LineaAgrupada>();
    for (const linea of documento.detalle) {
      const existente = mapa.get(linea.productoId);
      if (existente) {
        existente.cantidadOriginal += linea.cantidad;
      } else {
        mapa.set(linea.productoId, {
          productoId: linea.productoId,
          sku: linea.producto?.sku ?? '',
          nombre: linea.producto?.nombre ?? '',
          cantidadOriginal: linea.cantidad,
        });
      }
    }
    return Array.from(mapa.values());
  }, [documento.detalle]);

  const yaDevuelto = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const dev of devolucionesPrevias.data ?? []) {
      if (dev.estado !== 'CONFIRMADA') continue;
      for (const linea of dev.detalle) {
        mapa.set(linea.productoId, (mapa.get(linea.productoId) ?? 0) + linea.cantidad);
      }
    }
    return mapa;
  }, [devolucionesPrevias.data]);

  function disponibleDe(productoId: string, cantidadOriginal: number): number {
    return cantidadOriginal - (yaDevuelto.get(productoId) ?? 0);
  }

  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {};
    if (!motivo.trim()) nuevosErrores.motivo = 'El motivo es obligatorio';

    let algunaLinea = false;
    for (const l of lineas) {
      const valor = Number(cantidades[l.productoId] || 0);
      if (valor <= 0) continue;
      algunaLinea = true;
      const disponible = disponibleDe(l.productoId, l.cantidadOriginal);
      if (valor > disponible) {
        nuevosErrores[`cantidad-${l.productoId}`] = `Máximo disponible: ${disponible}`;
      }
    }
    if (!algunaLinea) nuevosErrores.detalle = 'Indica al menos una cantidad a devolver';

    setErrores(nuevosErrores);
    if (nuevosErrores.motivo) {
      document.getElementById('dev-motivo')?.focus();
    }
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validar()) return;

    const detalle = lineas
      .map((l) => ({ productoId: l.productoId, cantidad: Number(cantidades[l.productoId] || 0) }))
      .filter((l) => l.cantidad > 0);

    try {
      await crear.mutateAsync({
        tipo,
        ventaId: tipo === 'CLIENTE' ? documento.id : undefined,
        compraId: tipo === 'PROVEEDOR' ? documento.id : undefined,
        motivo: motivo.trim(),
        detalle,
      });
      toast.success('Devolución registrada — queda pendiente de confirmar');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la devolución');
    }
  }

  return (
    <Drawer
      title="Registrar devolución"
      subtitle={`De ${documento.numero}. Queda en borrador hasta confirmarla.`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <FormField label="Motivo" htmlFor="dev-motivo" error={errores.motivo}>
          <Textarea
            id="dev-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            aria-invalid={Boolean(errores.motivo)}
            placeholder="Ej: producto defectuoso, empaque dañado…"
          />
        </FormField>

        <h2 className={styles.seccionTitulo}>Líneas a devolver</h2>
        {errores.detalle && <p className={styles.errorGeneral}>{errores.detalle}</p>}

        {lineas.map((l) => {
          const disponible = disponibleDe(l.productoId, l.cantidadOriginal);
          const errorCantidad = errores[`cantidad-${l.productoId}`];
          return (
            <div key={l.productoId}>
              <div className={styles.linea}>
                <span className={styles.producto}>
                  {l.nombre}
                  <span className={styles.sku}>{l.sku}</span>
                </span>
                <span className={styles.disponible}>
                  Disponible: {disponible} de {l.cantidadOriginal}
                </span>
                <Input
                  type="number"
                  step="1"
                  className={styles.cantidadInput}
                  value={cantidades[l.productoId] ?? ''}
                  onChange={(e) => setCantidades((prev) => ({ ...prev, [l.productoId]: e.target.value }))}
                  aria-invalid={Boolean(errorCantidad)}
                  disabled={disponible <= 0}
                />
              </div>
              {errorCantidad && <p className={styles.errorCantidad}>{errorCantidad}</p>}
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? 'Registrando…' : 'Registrar devolución'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
