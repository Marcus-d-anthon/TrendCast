import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/endpoints/admin';
import { queryKeys } from './query-keys';

export function useAdminEmpresas() {
  return useQuery({ queryKey: queryKeys.adminEmpresas, queryFn: adminApi.listarEmpresas });
}

export function useAdminUsuarios() {
  return useQuery({ queryKey: queryKeys.adminUsuarios, queryFn: adminApi.listarUsuarios });
}
