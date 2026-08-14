import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import type { Usuario } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { paginar, Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { toast } from '../../components/ui/toast';
import { useEliminarUsuario, useUsuarios } from '../../queries/useUsuarios';
import { roleLabels } from '../../utils/role-labels';
import { UsuarioFormModal } from './UsuarioFormModal';

type FiltroEstado = 'activos' | 'inactivos' | 'todos';

export function UsuariosPage() {
  const usuarios = useUsuarios();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState<Usuario | null>(null);
  const [pagina, setPagina] = useState(1);
  // Por defecto solo cuentas activas: es lo que un administrador quiere ver
  // el 99% de las veces, sin que las desactivadas ensucien la vista.
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activos');

  const eliminar = useEliminarUsuario();

  const usuariosFiltrados = (usuarios.data ?? []).filter((u) => {
    if (filtroEstado === 'activos') return u.activo;
    if (filtroEstado === 'inactivos') return !u.activo;
    return true;
  });

  const total = usuariosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / 10));
  const filas = paginar(usuariosFiltrados, pagina);

  return (
    <div>
      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Cuentas con acceso al sistema. Solo un administrador puede registrar usuarios nuevos.
        </p>
        <Button onClick={() => setCreando(true)}>
          <Plus size={16} aria-hidden="true" /> Nuevo usuario
        </Button>
      </div>

      <FiltersCard>
        <FormField label="Estado" htmlFor="usr-filtro-estado">
          <Select
            id="usr-filtro-estado"
            value={filtroEstado}
            onChange={(e) => {
              setPagina(1);
              setFiltroEstado(e.target.value as FiltroEstado);
            }}
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </Select>
        </FormField>
      </FiltersCard>

      <Card>
        {usuarios.isLoading && <Skeleton height="14rem" />}
        {usuarios.isError && <ErrorState onRetry={() => usuarios.refetch()} />}
        {usuarios.data && usuarios.data.length === 0 && (
          <EmptyState icon={Users} title="Sin usuarios" description="Registra la primera cuenta del sistema." />
        )}
        {usuarios.data && usuarios.data.length > 0 && usuariosFiltrados.length === 0 && (
          <EmptyState
            icon={Users}
            title={filtroEstado === 'activos' ? 'Sin cuentas activas' : 'Sin cuentas inactivas'}
            description="Ningún usuario coincide con el filtro de estado aplicado."
          />
        )}
        {filas.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((usuario) => {
                  // La cuenta de Super Admin es sensible y unica: se ve en el
                  // listado por transparencia, pero no se edita ni elimina
                  // desde esta pantalla (ver UsuariosService.actualizar/eliminar).
                  const esSuperAdmin = usuario.rol === 'SUPERUSUARIO';
                  return (
                    <tr key={usuario.id}>
                      <td>{usuario.nombre}</td>
                      <td className={tableStyles.mono}>{usuario.email}</td>
                      <td>
                        <Badge variant={usuario.rol === 'ADMIN' ? 'info' : 'neutral'}>{roleLabels[usuario.rol]}</Badge>
                      </td>
                      <td>
                        <Badge variant={usuario.activo ? 'success' : 'neutral'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td>
                        {!esSuperAdmin && (
                          <div className={tableStyles.actionsCell}>
                            <button
                              type="button"
                              className={tableStyles.iconButton}
                              onClick={() => setEditando(usuario)}
                              aria-label={`Editar ${usuario.nombre}`}
                              title="Editar"
                            >
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className={`${tableStyles.iconButton} ${tableStyles.iconButtonDanger}`}
                              onClick={() => setEliminando(usuario)}
                              aria-label={`Eliminar ${usuario.nombre}`}
                              title="Eliminar"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 10 && (
          <Pagination pagina={pagina} totalPaginas={totalPaginas} totalItems={total} onCambiarPagina={setPagina} />
        )}
      </Card>

      {creando && <UsuarioFormModal onClose={() => setCreando(false)} />}
      {editando && <UsuarioFormModal usuario={editando} onClose={() => setEditando(null)} />}
      {eliminando && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`"${roleLabels[eliminando.rol]}" perderá acceso al sistema. ¿Está seguro que desea eliminar este usuario?`}
          confirmLabel="Eliminar"
          danger
          loading={eliminar.isPending}
          onClose={() => setEliminando(null)}
          onConfirm={async () => {
            try {
              await eliminar.mutateAsync(eliminando.id);
              toast.success('Usuario eliminado');
              setEliminando(null);
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'No se pudo eliminar el usuario');
            }
          }}
        />
      )}
    </div>
  );
}
