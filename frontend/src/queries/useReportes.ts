import { useQuery } from '@tanstack/react-query';
import { reportesApi, type RangoFechas } from '../api/endpoints/reportes';
import type { Granularidad } from '../api/types/domain';
import { queryKeys } from './query-keys';

export function useExistencias() {
  return useQuery({ queryKey: queryKeys.reportesExistencias, queryFn: reportesApi.existencias });
}

export function useRotacion(params: RangoFechas = {}) {
  return useQuery({
    queryKey: queryKeys.reportesRotacion(params),
    queryFn: () => reportesApi.rotacion(params),
  });
}

export function useMovimientosPorPeriodo(params: RangoFechas & { granularidad?: Granularidad } = {}) {
  return useQuery({
    queryKey: queryKeys.reportesMovimientosPorPeriodo(params),
    queryFn: () => reportesApi.movimientosPorPeriodo(params),
  });
}

export function useDashboardEjecutivo() {
  return useQuery({ queryKey: queryKeys.reportesDashboard, queryFn: reportesApi.dashboard });
}
