import { apiRequest } from '../http-client';
import type { Usuario } from '../types/domain';
import type { Rol } from '../../auth/types';

export interface CrearUsuarioInput {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
  almacenId?: string;
}

export interface ActualizarUsuarioInput {
  nombre?: string;
  rol?: Rol;
  almacenId?: string | null;
  activo?: boolean;
}

export const usuariosApi = {
  listar: () => apiRequest<Usuario[]>('/usuarios'),
  crear: (input: CrearUsuarioInput) => apiRequest<Usuario>('/usuarios', { method: 'POST', body: input }),
  actualizar: (id: string, input: ActualizarUsuarioInput) =>
    apiRequest<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: input }),
  eliminar: (id: string) => apiRequest<void>(`/usuarios/${id}`, { method: 'DELETE' }),
};
