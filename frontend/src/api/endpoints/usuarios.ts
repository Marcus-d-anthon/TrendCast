import { apiRequest } from '../http-client';
import type { Usuario } from '../types/domain';
import type { Rol } from '../../auth/types';

export interface CrearUsuarioInput {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export const usuariosApi = {
  listar: () => apiRequest<Usuario[]>('/usuarios'),
  crear: (input: CrearUsuarioInput) => apiRequest<Usuario>('/usuarios', { method: 'POST', body: input }),
};
