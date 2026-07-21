import { apiRequest } from '../http-client';
import type { Categoria } from '../types/domain';

export interface CrearCategoriaInput {
  nombre: string;
  descripcion?: string;
}

export interface ActualizarCategoriaInput {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export const categoriasApi = {
  listar: () => apiRequest<Categoria[]>('/categorias'),
  crear: (input: CrearCategoriaInput) => apiRequest<Categoria>('/categorias', { method: 'POST', body: input }),
  actualizar: (id: string, input: ActualizarCategoriaInput) =>
    apiRequest<Categoria>(`/categorias/${id}`, { method: 'PUT', body: input }),
  eliminar: (id: string) => apiRequest<void>(`/categorias/${id}`, { method: 'DELETE' }),
};
