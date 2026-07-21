import { apiRequest } from '../http-client';
import type { ExistenciasReporte, Granularidad, MovimientosPorPeriodoItem, RotacionItem } from '../types/domain';

export interface RangoFechas {
  [key: string]: string | number | boolean | undefined;
  desde?: string;
  hasta?: string;
}

export const reportesApi = {
  existencias: () => apiRequest<ExistenciasReporte>('/reportes/existencias'),

  rotacion: (params: RangoFechas = {}) => apiRequest<RotacionItem[]>('/reportes/rotacion', { query: params }),

  movimientosPorPeriodo: (params: RangoFechas & { granularidad?: Granularidad } = {}) =>
    apiRequest<MovimientosPorPeriodoItem[]>('/reportes/movimientos-por-periodo', { query: params }),
};
