import { Building2 } from 'lucide-react';
import { cambiarEmpresaVista, getEmpresaVista } from '../../auth/empresa-vista';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useAdminEmpresas, useAdminUsuarios } from '../../queries/useAdmin';
import { roleLabels } from '../../utils/role-labels';
import { formatDate } from '../../utils/format';
import styles from './AdminPage.module.css';

export function AdminPage() {
  const empresas = useAdminEmpresas();
  const usuarios = useAdminUsuarios();

  return (
    <div>
      <h1 className={styles.titulo}>Panel Super Admin</h1>
      <p className={styles.subtitulo}>
        Vista de solo lectura de todas las empresas y usuarios del sistema. No permite crear empresas
        nuevas todavía — es un panel de visibilidad, no de administración multi-tenant.
      </p>

      <Card className={styles.sectionGap}>
        <h2 className={styles.tituloSeccion}>Empresas</h2>
        {empresas.isLoading && <Skeleton height="10rem" />}
        {empresas.isError && <ErrorState onRetry={() => empresas.refetch()} />}
        {empresas.data && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Razón social</th>
                  <th>RUC</th>
                  <th style={{ textAlign: 'right' }}>Usuarios</th>
                  <th style={{ textAlign: 'right' }}>Productos</th>
                  <th style={{ textAlign: 'right' }}>Almacenes</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.data.map((empresa) => {
                  const esActual = (getEmpresaVista() ?? '') === empresa.id;
                  return (
                    <tr key={empresa.id}>
                      <td>{empresa.razonSocial}</td>
                      <td className={tableStyles.mono}>{empresa.ruc}</td>
                      <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                        {empresa._count.usuarios}
                      </td>
                      <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                        {empresa._count.productos}
                      </td>
                      <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                        {empresa._count.almacenes}
                      </td>
                      <td>
                        <Badge variant={empresa.activo ? 'success' : 'neutral'}>
                          {empresa.activo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={esActual}
                          onClick={() => cambiarEmpresaVista(empresa.id)}
                        >
                          <Building2 size={14} aria-hidden="true" /> {esActual ? 'Viendo esta' : 'Ver esta empresa'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className={styles.sectionGap}>
        <h2 className={styles.tituloSeccion}>Usuarios de esta empresa</h2>
        {usuarios.isLoading && <Skeleton height="14rem" />}
        {usuarios.isError && <ErrorState onRetry={() => usuarios.refetch()} />}
        {usuarios.data && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Empresa</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.data.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre}</td>
                    <td className={tableStyles.mono}>{usuario.email}</td>
                    <td>{usuario.empresa.razonSocial}</td>
                    <td>
                      <Badge variant={usuario.rol === 'SUPERUSUARIO' ? 'info' : 'neutral'}>
                        {roleLabels[usuario.rol as keyof typeof roleLabels] ?? usuario.rol}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={usuario.activo ? 'success' : 'neutral'}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className={tableStyles.mono}>{formatDate(usuario.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
