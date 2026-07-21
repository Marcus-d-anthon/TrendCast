import { apiRequest } from '../http-client';
import type { Venta } from '../types/domain';

export interface DetalleVentaInput {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearVentaInput {
  clienteId: string;
  almacenId: string;
  detalle: DetalleVentaInput[];
}

export const ventasApi = {
  listar: () => apiRequest<Venta[]>('/ventas'),
  obtener: (id: string) => apiRequest<Venta>(`/ventas/${id}`),
  crear: (input: CrearVentaInput) => apiRequest<Venta>('/ventas', { method: 'POST', body: input }),
  confirmar: (id: string) => apiRequest<Venta>(`/ventas/${id}/confirmar`, { method: 'POST' }),
  anular: (id: string) => apiRequest<Venta>(`/ventas/${id}/anular`, { method: 'POST' }),
};
