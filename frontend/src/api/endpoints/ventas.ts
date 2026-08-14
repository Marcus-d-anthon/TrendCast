import { apiRequest, apiRequestPaginado, type RespuestaPaginada } from '../http-client';
import type { EstadoDocumentoComercial, Venta } from '../types/domain';

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

export interface ListarVentasPaginadoParams {
  [key: string]: string | number | boolean | undefined;
  page: number;
  pageSize?: number;
  estado?: EstadoDocumentoComercial;
  desde?: string;
  hasta?: string;
}

export const ventasApi = {
  listar: () => apiRequest<Venta[]>('/ventas'),
  listarPaginado: (params: ListarVentasPaginadoParams): Promise<RespuestaPaginada<Venta>> =>
    apiRequestPaginado<Venta>('/ventas', { query: params }),
  obtener: (id: string) => apiRequest<Venta>(`/ventas/${id}`),
  crear: (input: CrearVentaInput) => apiRequest<Venta>('/ventas', { method: 'POST', body: input }),
  confirmar: (id: string) => apiRequest<Venta>(`/ventas/${id}/confirmar`, { method: 'POST' }),
  anular: (id: string) => apiRequest<Venta>(`/ventas/${id}/anular`, { method: 'POST' }),
};
