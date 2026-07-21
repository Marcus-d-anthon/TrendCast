import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productosApi,
  type ActualizarProductoInput,
  type CrearProductoInput,
} from '../api/endpoints/productos';
import { queryKeys } from './query-keys';

export function useProductos() {
  return useQuery({ queryKey: queryKeys.productos, queryFn: productosApi.listar });
}

export function useProducto(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.producto(id ?? ''),
    queryFn: () => productosApi.obtener(id as string),
    enabled: Boolean(id),
  });
}

export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearProductoInput) => productosApi.crear(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportesExistencias });
    },
  });
}

export function useActualizarProducto(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarProductoInput) => productosApi.actualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.producto(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
    },
  });
}

export function useEliminarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productosApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.alertas });
    },
  });
}
