import { apiDownload, apiRequest } from '../http-client';
import type {
  DashboardEjecutivo,
  ExistenciasReporte,
  FormatoExport,
  Granularidad,
  MovimientosPorPeriodoItem,
  RotacionItem,
} from '../types/domain';

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

  dashboard: () => apiRequest<DashboardEjecutivo>('/reportes/dashboard'),

  exportarExistencias: (formato: FormatoExport) =>
    apiDownload('/reportes/existencias/exportar', { formato }, `existencias.${formato}`),

  exportarRotacion: (formato: FormatoExport, params: RangoFechas = {}) =>
    apiDownload('/reportes/rotacion/exportar', { ...params, formato }, `rotacion.${formato}`),
};
