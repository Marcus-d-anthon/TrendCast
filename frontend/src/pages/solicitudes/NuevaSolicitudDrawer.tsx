import { useState, type FormEvent } from 'react';
import type { TipoSolicitud } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from '../../components/ui/toast';
import { useAlmacenes } from '../../queries/useAlmacenes';
import { useProductos } from '../../queries/useProductos';
import { useCrearSolicitud } from '../../queries/useSolicitudes';

interface NuevaSolicitudDrawerProps {
  onClose: () => void;
}

const TIPOS: { value: TipoSolicitud; label: string }[] = [
  { value: 'REABASTECIMIENTO', label: 'Reabastecimiento' },
  { value: 'VENTA_ESPECIAL', label: 'Venta especial' },
];

export function NuevaSolicitudDrawer({ onClose }: NuevaSolicitudDrawerProps) {
  const productos = useProductos();
  const almacenes = useAlmacenes();
  const crear = useCrearSolicitud();

  const [tipo, setTipo] = useState<TipoSolicitud>('REABASTECIMIENTO');
  const [productoId, setProductoId] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Misma logica que UsuarioFormModal: validacion manual (no el `required`
  // nativo, que dispara su propio tooltip del navegador y nunca llega a
  // correr este codigo) para poder marcar el campo en rojo y llevar el foco.
  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {};
    if (!productoId) nuevosErrores.productoId = 'Selecciona un producto';
    if (!almacenId) nuevosErrores.almacenId = 'Selecciona un almacén';
    if (!cantidad || Number(cantidad) < 1) nuevosErrores.cantidad = 'Ingresa una cantidad válida';

    setErrores(nuevosErrores);
    const primerCampoInvalido = Object.keys(nuevosErrores)[0];
    if (primerCampoInvalido) {
      const idPorCampo: Record<string, string> = {
        productoId: 'sol-producto',
        almacenId: 'sol-almacen',
        cantidad: 'sol-cantidad',
      };
      document.getElementById(idPorCampo[primerCampoInvalido])?.focus();
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validar()) return;
    try {
      await crear.mutateAsync({
        tipo,
        productoId,
        almacenId,
        cantidad: Number(cantidad),
        comentario: comentario || undefined,
      });
      toast.success('Solicitud creada — queda pendiente de aprobación');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la solicitud');
    }
  }

  return (
    <Drawer title="Nueva solicitud" subtitle="Queda pendiente de aprobación por Gerencia." onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <FormField label="Tipo de solicitud" htmlFor="sol-tipo">
          <Select id="sol-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoSolicitud)} required>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Producto" htmlFor="sol-producto" error={errores.productoId}>
          <SearchSelect
            id="sol-producto"
            options={(productos.data ?? []).map((p) => ({ value: p.id, label: `${p.sku} · ${p.nombre}`, busqueda: p.sku }))}
            value={productoId}
            onChange={setProductoId}
            placeholder="Busca por nombre o SKU…"
            ariaLabel="Producto"
            invalid={Boolean(errores.productoId)}
          />
        </FormField>

        <FormField label="Almacén" htmlFor="sol-almacen" error={errores.almacenId}>
          <Select
            id="sol-almacen"
            value={almacenId}
            onChange={(e) => setAlmacenId(e.target.value)}
            aria-invalid={Boolean(errores.almacenId)}
          >
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

        <FormField label="Cantidad" htmlFor="sol-cantidad" error={errores.cantidad}>
          <Input
            id="sol-cantidad"
            type="number"
            min={1}
            step="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            aria-invalid={Boolean(errores.cantidad)}
          />
        </FormField>

        <FormField label="Comentario" htmlFor="sol-comentario" hint="Opcional: contexto para quien la apruebe">
          <Textarea id="sol-comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
