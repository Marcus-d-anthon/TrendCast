import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  categoriasApi,
  type ActualizarCategoriaInput,
  type CrearCategoriaInput,
} from '../api/endpoints/categorias';
import { queryKeys } from './query-keys';

export function useCategorias() {
  return useQuery({ queryKey: queryKeys.categorias, queryFn: categoriasApi.listar });
}

export function useCrearCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearCategoriaInput) => categoriasApi.crear(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categorias }),
  });
}

export function useActualizarCategoria(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarCategoriaInput) => categoriasApi.actualizar(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categorias }),
  });
}

export function useEliminarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriasApi.eliminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categorias }),
  });
}
