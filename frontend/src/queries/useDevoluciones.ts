import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  devolucionesApi,
  type CrearDevolucionInput,
  type ListarDevolucionesPaginadoParams,
  type ListarDevolucionesParams,
} from '../api/endpoints/devoluciones';
import { queryKeys } from './query-keys';

export function useDevolucionesDeDocumento(params: ListarDevolucionesParams) {
  return useQuery({
    queryKey: queryKeys.devoluciones(params),
    queryFn: () => devolucionesApi.listarPorDocumento(params),
    enabled: Boolean(params.ventaId || params.compraId),
  });
}

export function useDevolucionesPaginado(params: ListarDevolucionesPaginadoParams) {
  return useQuery({
    queryKey: queryKeys.devolucionesPaginado(params),
    queryFn: () => devolucionesApi.listarPaginado(params),
    placeholderData: keepPreviousData,
  });
}

export function useDevolucion(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.devolucion(id ?? ''),
    queryFn: () => devolucionesApi.obtener(id as string),
    enabled: Boolean(id),
  });
}

export function useCrearDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearDevolucionInput) => devolucionesApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
    },
  });
}

export function useConfirmarDevolucion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => devolucionesApi.confirmar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devoluciones'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportesExistencias });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    },
  });
}
