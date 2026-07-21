import { apiRequest } from '../http-client';
import type { Compra } from '../types/domain';

export interface DetalleCompraInput {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearCompraInput {
  proveedorId: string;
  almacenId: string;
  detalle: DetalleCompraInput[];
}

export const comprasApi = {
  listar: () => apiRequest<Compra[]>('/compras'),
  obtener: (id: string) => apiRequest<Compra>(`/compras/${id}`),
  crear: (input: CrearCompraInput) => apiRequest<Compra>('/compras', { method: 'POST', body: input }),
  confirmar: (id: string) => apiRequest<Compra>(`/compras/${id}/confirmar`, { method: 'POST' }),
  anular: (id: string) => apiRequest<Compra>(`/compras/${id}/anular`, { method: 'POST' }),
};
