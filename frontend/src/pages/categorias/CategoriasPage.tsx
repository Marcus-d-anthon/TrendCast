import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ApiError } from '../../api/http-client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { toast } from '../../components/ui/toast';
import { useAuth } from '../../auth/useAuth';
import { useCategorias, useEliminarCategoria } from '../../queries/useCategorias';
import type { Categoria } from '../../api/types/domain';
import { CategoriaFormModal } from './CategoriaFormModal';
import styles from './CategoriasPage.module.css';

export function CategoriasPage() {
  const { usuario } = useAuth();
  const puedeEscribir = usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPERVISOR';

  const categorias = useCategorias();
  const eliminar = useEliminarCategoria();

  const [editando, setEditando] = useState<Categoria | undefined | null>(null);
  const [creando, setCreando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<Categoria | null>(null);

  return (
    <div className={styles.page}>
      <div className={tableStyles.toolbar}>
        <p className={styles.description}>Categorías usadas para clasificar el catálogo de productos.</p>
        {puedeEscribir && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} aria-hidden="true" /> Nueva categoría
          </Button>
        )}
      </div>

      <Card>
        {categorias.isLoading && <Skeleton height="10rem" />}
        {categorias.isError && <ErrorState onRetry={() => categorias.refetch()} />}
        {categorias.data && categorias.data.length === 0 && (
          <EmptyState
            icon={Tags}
            title="Sin categorías"
            description="Crea la primera categoría para poder registrar productos."
          />
        )}
        {categorias.data && categorias.data.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  {puedeEscribir && <th />}
                </tr>
              </thead>
              <tbody>
                {categorias.data.map((categoria) => (
                  <tr key={categoria.id}>
                    <td>{categoria.nombre}</td>
                    <td>{categoria.descripcion || '—'}</td>
                    <td>
                      <Badge variant={categoria.activo ? 'success' : 'neutral'}>
                        {categoria.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    {puedeEscribir && (
                      <td>
                        <div className={tableStyles.actionsCell}>
                          <button
                            type="button"
                            className={tableStyles.iconButton}
                            onClick={() => setEditando(categoria)}
                            aria-label={`Editar ${categoria.nombre}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${tableStyles.iconButton} ${tableStyles.iconButtonDanger}`}
                            onClick={() => setPorEliminar(categoria)}
                            aria-label={`Eliminar ${categoria.nombre}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creando && <CategoriaFormModal onClose={() => setCreando(false)} />}
      {editando && <CategoriaFormModal categoria={editando} onClose={() => setEditando(null)} />}
      {porEliminar && (
        <ConfirmDialog
          title="Dar de baja categoría"
          message={`"${porEliminar.nombre}" dejará de estar disponible para nuevos productos. El registro se conserva (baja lógica).`}
          confirmLabel="Dar de baja"
          danger
          loading={eliminar.isPending}
          onClose={() => setPorEliminar(null)}
          onConfirm={async () => {
            try {
              await eliminar.mutateAsync(porEliminar.id);
              toast.success('Categoría dada de baja');
              setPorEliminar(null);
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'No se pudo dar de baja la categoría');
            }
          }}
        />
      )}
    </div>
  );
}
