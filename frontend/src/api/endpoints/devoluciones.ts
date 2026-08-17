import { apiRequest, apiRequestPaginado, type RespuestaPaginada } from '../http-client';
import type { Devolucion, EstadoDocumentoComercial, TipoDevolucion } from '../types/domain';

export interface DetalleDevolucionInput {
  productoId: string;
  cantidad: number;
}

export interface CrearDevolucionInput {
  tipo: TipoDevolucion;
  ventaId?: string;
  compraId?: string;
  motivo: string;
  detalle: DetalleDevolucionInput[];
}

export interface ListarDevolucionesParams {
  [key: string]: string | number | boolean | undefined;
  ventaId?: string;
  compraId?: string;
}

export interface ListarDevolucionesPaginadoParams {
  [key: string]: string | number | boolean | undefined;
  page: number;
  pageSize?: number;
  estado?: EstadoDocumentoComercial;
  tipo?: TipoDevolucion;
}

export const devolucionesApi = {
  // Sin paginar, filtrado por documento origen -- lo usan VentaDetailPage/
  // CompraDetailPage para listar las devoluciones de un documento especifico.
  listarPorDocumento: (params: ListarDevolucionesParams) => apiRequest<Devolucion[]>('/devoluciones', { query: params }),
  listarPaginado: (params: ListarDevolucionesPaginadoParams): Promise<RespuestaPaginada<Devolucion>> =>
    apiRequestPaginado<Devolucion>('/devoluciones', { query: params }),
  obtener: (id: string) => apiRequest<Devolucion>(`/devoluciones/${id}`),
  crear: (input: CrearDevolucionInput) => apiRequest<Devolucion>('/devoluciones', { method: 'POST', body: input }),
  confirmar: (id: string) => apiRequest<Devolucion>(`/devoluciones/${id}/confirmar`, { method: 'POST' }),
};
