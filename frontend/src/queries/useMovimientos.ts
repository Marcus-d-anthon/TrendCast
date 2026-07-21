import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  movimientosApi,
  type ListarMovimientosParams,
  type RegistrarMovimientoInput,
} from '../api/endpoints/movimientos';
import { queryKeys } from './query-keys';

export function useMovimientos(params: ListarMovimientosParams = {}) {
  return useQuery({ queryKey: queryKeys.movimientos(params), queryFn: () => movimientosApi.listar(params) });
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
