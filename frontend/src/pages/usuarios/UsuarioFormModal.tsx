import { useState, type FormEvent } from 'react';
import type { Rol } from '../../auth/types';
import { ApiError } from '../../api/http-client';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { toast } from '../../components/ui/toast';
import { useCrearUsuario } from '../../queries/useUsuarios';

interface UsuarioFormModalProps {
  onClose: () => void;
}

export function UsuarioFormModal({ onClose }: UsuarioFormModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState<Rol>('BODEGA');
  const [error, setError] = useState<string | null>(null);

  const crear = useCrearUsuario();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await crear.mutateAsync({ email, password, nombre, rol });
      toast.success('Usuario registrado');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el usuario');
    }
  }

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            {error}
          </p>
        )}

        <FormField label="Nombre" htmlFor="usr-nombre">
          <Input id="usr-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </FormField>

        <FormField label="Correo" htmlFor="usr-email">
          <Input id="usr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormField>

        <FormField label="Contraseña" htmlFor="usr-password" hint="Mínimo 8 caracteres">
          <Input
            id="usr-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </FormField>

        <FormField label="Rol" htmlFor="usr-rol">
          <Select id="usr-rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)} required>
            <option value="BODEGA">Bodega</option>
            <option value="VENTAS">Ventas</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="GERENCIA">Gerencia</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? 'Guardando…' : 'Registrar usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
