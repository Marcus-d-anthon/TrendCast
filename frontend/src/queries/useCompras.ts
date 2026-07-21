import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comprasApi, type CrearCompraInput } from '../api/endpoints/compras';
import { queryKeys } from './query-keys';

export function useCompras() {
  return useQuery({ queryKey: queryKeys.compras, queryFn: comprasApi.listar });
}

export function useCompra(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.compra(id ?? ''),
    queryFn: () => comprasApi.obtener(id as string),
    enabled: Boolean(id),
  });
}

export function useCrearCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearCompraInput) => comprasApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.compras });
    },
  });
}

// confirmar/anular afectan stock real (confirmar genera ENTRADA por linea):
// se invalida productos, alertas y el reporte de existencias, igual que
// useRegistrarMovimiento en useMovimientos.ts.
export function useConfirmarCompra(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => comprasApi.confirmar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.compras });
      queryClient.invalidateQueries({ queryKey: queryKeys.compra(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportesExistencias });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    },
  });
}

export function useAnularCompra(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => comprasApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.compras });
      queryClient.invalidateQueries({ queryKey: queryKeys.compra(id) });
    },
  });
}
