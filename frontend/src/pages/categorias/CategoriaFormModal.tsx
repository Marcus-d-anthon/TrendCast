import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http-client';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from '../../components/ui/toast';
import { useActualizarCategoria, useCrearCategoria } from '../../queries/useCategorias';
import type { Categoria } from '../../api/types/domain';

interface CategoriaFormModalProps {
  categoria?: Categoria;
  onClose: () => void;
}

export function CategoriaFormModal({ categoria, onClose }: CategoriaFormModalProps) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
  const [error, setError] = useState<string | null>(null);

  const crear = useCrearCategoria();
  const actualizar = useActualizarCategoria(categoria?.id ?? '');
  const guardando = crear.isPending || actualizar.isPending;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (categoria) {
        await actualizar.mutateAsync({ nombre, descripcion: descripcion || undefined });
        toast.success('Categoría actualizada');
      } else {
        await crear.mutateAsync({ nombre, descripcion: descripcion || undefined });
        toast.success('Categoría creada');
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la categoría');
    }
  }

  return (
    <Modal title={categoria ? 'Editar categoría' : 'Nueva categoría'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}
        <FormField label="Nombre" htmlFor="cat-nombre">
          <Input id="cat-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </FormField>
        <FormField label="Descripción" htmlFor="cat-descripcion" hint="Opcional">
          <Textarea id="cat-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
