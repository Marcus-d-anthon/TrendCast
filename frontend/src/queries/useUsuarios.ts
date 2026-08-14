import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usuariosApi, type ActualizarUsuarioInput, type CrearUsuarioInput } from '../api/endpoints/usuarios';
import { queryKeys } from './query-keys';

export function useUsuarios() {
  return useQuery({ queryKey: queryKeys.usuarios, queryFn: usuariosApi.listar });
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearUsuarioInput) => usuariosApi.crear(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usuarios }),
  });
}

export function useActualizarUsuario(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActualizarUsuarioInput) => usuariosApi.actualizar(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usuarios }),
  });
}

export function useEliminarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usuariosApi.eliminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usuarios }),
  });
}
