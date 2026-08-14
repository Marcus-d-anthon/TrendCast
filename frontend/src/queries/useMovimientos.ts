import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  movimientosApi,
  type ListarMovimientosParams,
  type ListarMovimientosPaginadoParams,
  type RegistrarMovimientoInput,
} from '../api/endpoints/movimientos';
import { queryKeys } from './query-keys';

export function useMovimientos(params: ListarMovimientosParams = {}, opciones: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.movimientos(params),
    queryFn: () => movimientosApi.listar(params),
    enabled: opciones.enabled ?? true,
  });
}

export function useMovimientosPaginado(params: ListarMovimientosPaginadoParams, opciones: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.movimientosPaginado(params),
    queryFn: () => movimientosApi.listarPaginado(params),
    placeholderData: keepPreviousData,
    enabled: opciones.enabled ?? true,
  });
}

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegistrarMovimientoInput) => movimientosApi.registrar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportesExistencias });
    },
  });
}
