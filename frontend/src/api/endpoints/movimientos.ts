import { apiRequest, apiRequestPaginado, type RespuestaPaginada } from '../http-client';
import type { Movimiento, TipoMovimiento } from '../types/domain';

export interface ListarMovimientosParams {
  [key: string]: string | number | boolean | undefined;
  productoId?: string;
  almacenId?: string;
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
}

export interface ListarMovimientosPaginadoParams extends ListarMovimientosParams {
  page: number;
  pageSize?: number;
}

export interface RegistrarMovimientoInput {
  productoId: string;
  almacenId: string;
  tipo: Exclude<TipoMovimiento, 'TRANSFERENCIA'>;
  cantidad: number;
  referencia?: string;
  motivo?: string;
  movimientoOrigenId?: string;
}

export const movimientosApi = {
  listar: (params: ListarMovimientosParams = {}) => apiRequest<Movimiento[]>('/movimientos', { query: params }),
  listarPaginado: (params: ListarMovimientosPaginadoParams): Promise<RespuestaPaginada<Movimiento>> =>
    apiRequestPaginado<Movimiento>('/movimientos', { query: params }),

  registrar: (input: RegistrarMovimientoInput) =>
    apiRequest<Movimiento>('/movimientos', { method: 'POST', body: input }),
};
