import { useQuery } from '@tanstack/react-query';
import { alertasApi } from '../api/endpoints/alertas';
import { queryKeys } from './query-keys';

export function useAlertas() {
  return useQuery({ queryKey: queryKeys.alertas, queryFn: alertasApi.listar });
}
