import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usuariosApi, type CrearUsuarioInput } from '../api/endpoints/usuarios';
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
