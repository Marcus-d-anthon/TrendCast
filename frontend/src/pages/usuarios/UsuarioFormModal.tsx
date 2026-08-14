import { useState, type FormEvent } from 'react';
import type { Usuario } from '../../api/types/domain';
import type { Rol } from '../../auth/types';
import { ApiError } from '../../api/http-client';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Modal } from '../../components/ui/Modal';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { Select } from '../../components/ui/Select';
import { toast } from '../../components/ui/toast';
import { useAlmacenes } from '../../queries/useAlmacenes';
import { useActualizarUsuario, useCrearUsuario } from '../../queries/useUsuarios';

interface UsuarioFormModalProps {
  usuario?: Usuario;
  onClose: () => void;
}

export function UsuarioFormModal({ usuario, onClose }: UsuarioFormModalProps) {
  const editando = Boolean(usuario);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? 'BODEGA');
  const [almacenId, setAlmacenId] = useState(usuario?.almacenId ?? '');
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const almacenes = useAlmacenes();
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario(usuario?.id ?? '');
  const guardando = editando ? actualizar.isPending : crear.isPending;

  // Valida campo por campo (en vez de solo el `required` nativo del
  // navegador) para poder marcar el casillero en rojo y llevar el foco ahi
  // -- ahorra tener que ir buscando cual quedo vacio a mano.
  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {};
    if (!nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    if (!editando) {
      if (!email.trim()) nuevosErrores.email = 'El correo es obligatorio';
      if (!password || password.length < 8) nuevosErrores.password = 'Mínimo 8 caracteres';
    }
    if (rol === 'BODEGA' && !almacenId) nuevosErrores.almacenId = 'Selecciona un almacén';

    setErrores(nuevosErrores);
    const primerCampoInvalido = Object.keys(nuevosErrores)[0];
    if (primerCampoInvalido) {
      const idPorCampo: Record<string, string> = {
        nombre: 'usr-nombre',
        email: 'usr-email',
        password: 'usr-password',
        almacenId: 'usr-almacen',
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
      if (editando && usuario) {
        await actualizar.mutateAsync({
          nombre,
          rol,
          almacenId: rol === 'BODEGA' ? almacenId : null,
          activo,
        });
        toast.success('Usuario actualizado');
      } else {
        await crear.mutateAsync({ email, password, nombre, rol, almacenId: rol === 'BODEGA' ? almacenId : undefined });
        toast.success('Usuario registrado');
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el usuario');
    }
  }

  return (
    <Modal title={editando ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <FormField label="Nombre" htmlFor="usr-nombre" error={errores.nombre}>
          <Input
            id="usr-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={Boolean(errores.nombre)}
          />
        </FormField>

        {editando ? (
          <FormField label="Correo" htmlFor="usr-email" hint="El correo no se puede modificar">
            <Input id="usr-email" type="email" value={usuario?.email ?? ''} disabled />
          </FormField>
        ) : (
          <>
            <FormField label="Correo" htmlFor="usr-email" error={errores.email}>
              <Input
                id="usr-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errores.email)}
              />
            </FormField>

            <FormField label="Contraseña" htmlFor="usr-password" hint="Mínimo 8 caracteres" error={errores.password}>
              <PasswordInput
                id="usr-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errores.password)}
                minLength={8}
              />
            </FormField>
          </>
        )}

        <FormField label="Rol" htmlFor="usr-rol">
          <Select id="usr-rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)} required>
            <option value="BODEGA">Bodega</option>
            <option value="VENTAS">Ventas</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="GERENCIA">Gerencia</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </FormField>

        {rol === 'BODEGA' && (
          <FormField label="Almacén asignado" htmlFor="usr-almacen" hint="Un bodeguero solo ve y opera su propio almacén" error={errores.almacenId}>
            <SearchSelect
              id="usr-almacen"
              options={(almacenes.data ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
              value={almacenId}
              onChange={setAlmacenId}
              placeholder="Selecciona un almacén…"
              ariaLabel="Almacén asignado"
              invalid={Boolean(errores.almacenId)}
            />
          </FormField>
        )}

        {editando && (
          <FormField label="Estado" htmlFor="usr-activo">
            <Select id="usr-activo" value={activo ? 'activo' : 'inactivo'} onChange={(e) => setActivo(e.target.value === 'activo')}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Select>
          </FormField>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
