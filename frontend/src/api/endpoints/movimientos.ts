import { apiRequest } from '../http-client';
import type { Movimiento, TipoMovimiento } from '../types/domain';

export interface ListarMovimientosParams {
  [key: string]: string | number | boolean | undefined;
  productoId?: string;
  almacenId?: string;
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
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

  registrar: (input: RegistrarMovimientoInput) =>
    apiRequest<Movimiento>('/movimientos', { method: 'POST', body: input }),
};
