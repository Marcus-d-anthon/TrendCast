import { apiDownload, apiRequest } from '../http-client';
import type { FormatoExport, Producto } from '../types/domain';

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

export interface FilaImportacionError {
  fila: number;
  sku: string;
  mensaje: string;
}

export interface ImportarProductosResultado {
  totalFilas: number;
  creados: number;
  errores: FilaImportacionError[];
}

export const productosApi = {
  listar: () => apiRequest<Producto[]>('/productos'),
  obtener: (id: string) => apiRequest<Producto>(`/productos/${id}`),
  crear: (input: CrearProductoInput) => apiRequest<Producto>('/productos', { method: 'POST', body: input }),
  actualizar: (id: string, input: ActualizarProductoInput) =>
    apiRequest<Producto>(`/productos/${id}`, { method: 'PUT', body: input }),
  eliminar: (id: string) => apiRequest<void>(`/productos/${id}`, { method: 'DELETE' }),
  importar: (filas: CrearProductoInput[]) =>
    apiRequest<ImportarProductosResultado>('/productos/importar', { method: 'POST', body: { filas } }),
  exportar: (formato: FormatoExport) => apiDownload('/productos/exportar', { formato }, `productos.${formato}`),
};
