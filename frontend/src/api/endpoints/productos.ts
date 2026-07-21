import { apiRequest } from '../http-client';
import type { Producto } from '../types/domain';

export interface CrearProductoInput {
  sku: string;
  nombre: string;
  descripcion?: string;
  categoriaId: string;
  marcaId: string;
  unidadMedidaId: string;
  precioCompra: number;
  precioVenta: number;
  stockMinimo?: number;
  requiereLote?: boolean;
}

export type ActualizarProductoInput = Partial<Omit<CrearProductoInput, 'sku'>> & { activo?: boolean };

export const productosApi = {
  listar: () => apiRequest<Producto[]>('/productos'),
  obtener: (id: string) => apiRequest<Producto>(`/productos/${id}`),
  crear: (input: CrearProductoInput) => apiRequest<Producto>('/productos', { method: 'POST', body: input }),
  actualizar: (id: string, input: ActualizarProductoInput) =>
    apiRequest<Producto>(`/productos/${id}`, { method: 'PUT', body: input }),
  eliminar: (id: string) => apiRequest<void>(`/productos/${id}`, { method: 'DELETE' }),
};
