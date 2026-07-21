import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useUsuarios } from '../../queries/useUsuarios';
import { roleLabels } from '../../utils/role-labels';
import { UsuarioFormModal } from './UsuarioFormModal';

export function UsuariosPage() {
  const usuarios = useUsuarios();
  const [creando, setCreando] = useState(false);

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

      <Card>
        {usuarios.isLoading && <Skeleton height="14rem" />}
        {usuarios.isError && <ErrorState onRetry={() => usuarios.refetch()} />}
        {usuarios.data && usuarios.data.length === 0 && (
          <EmptyState icon={Users} title="Sin usuarios" description="Registra la primera cuenta del sistema." />
        )}
        {usuarios.data && usuarios.data.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.data.map((usuario) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creando && <UsuarioFormModal onClose={() => setCreando(false)} />}
    </div>
  );
}
