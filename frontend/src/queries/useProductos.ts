import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productosApi,
  type ActualizarProductoInput,
  type CrearProductoInput,
  type ListarProductosPaginadoParams,
} from '../api/endpoints/productos';
import { queryKeys } from './query-keys';

export function useProductos() {
  return useQuery({ queryKey: queryKeys.productos, queryFn: productosApi.listar });
}

// keepPreviousData: al cambiar de pagina o escribir en el buscador, la tabla
// se queda mostrando los resultados anteriores (sin parpadear a un estado de
// carga vacio) hasta que llega la respuesta nueva.
export function useProductosPaginado(params: ListarProductosPaginadoParams) {
  return useQuery({
    queryKey: queryKeys.productosPaginado(params),
    queryFn: () => productosApi.listarPaginado(params),
    placeholderData: keepPreviousData,
  });
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

export function useImportarProductos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filas: CrearProductoInput[]) => productosApi.importar(filas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.reportesExistencias });
    },
  });
}
