import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ventasApi, type CrearVentaInput } from '../api/endpoints/ventas';
import { queryKeys } from './query-keys';

export function useVentas() {
  return useQuery({ queryKey: queryKeys.ventas, queryFn: ventasApi.listar });
}

export function useVenta(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.venta(id ?? ''),
    queryFn: () => ventasApi.obtener(id as string),
    enabled: Boolean(id),
  });
}

export function useCrearVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearVentaInput) => ventasApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ventas });
    },
  });
}

export function useConfirmarVenta(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ventasApi.confirmar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ventas });
      queryClient.invalidateQueries({ queryKey: queryKeys.venta(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportesExistencias });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    },
  });
}

export function useAnularVenta(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ventasApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ventas });
      queryClient.invalidateQueries({ queryKey: queryKeys.venta(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
    },
  });
}
