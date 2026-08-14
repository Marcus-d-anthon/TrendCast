import { useQuery } from '@tanstack/react-query';
import { auditoriaApi, type ListarAuditoriaParams } from '../api/endpoints/auditoria';
import { queryKeys } from './query-keys';

export function useAuditoria(params: ListarAuditoriaParams) {
  return useQuery({ queryKey: queryKeys.auditoria(params), queryFn: () => auditoriaApi.listar(params) });
}
