import { apiRequest, apiRequestPaginado, type RespuestaPaginada } from '../http-client';
import type { Compra, EstadoDocumentoComercial } from '../types/domain';

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

export interface ListarComprasPaginadoParams {
  [key: string]: string | number | boolean | undefined;
  page: number;
  pageSize?: number;
  estado?: EstadoDocumentoComercial;
  desde?: string;
  hasta?: string;
}

export const comprasApi = {
  listar: () => apiRequest<Compra[]>('/compras'),
  listarPaginado: (params: ListarComprasPaginadoParams): Promise<RespuestaPaginada<Compra>> =>
    apiRequestPaginado<Compra>('/compras', { query: params }),
  obtener: (id: string) => apiRequest<Compra>(`/compras/${id}`),
  crear: (input: CrearCompraInput) => apiRequest<Compra>('/compras', { method: 'POST', body: input }),
  confirmar: (id: string) => apiRequest<Compra>(`/compras/${id}/confirmar`, { method: 'POST' }),
  anular: (id: string) => apiRequest<Compra>(`/compras/${id}/anular`, { method: 'POST' }),
};
