import { useQuery } from '@tanstack/react-query';
import { almacenesApi } from '../api/endpoints/almacenes';
import { queryKeys } from './query-keys';

export function useAlmacenes() {
  return useQuery({ queryKey: queryKeys.almacenes, queryFn: almacenesApi.listar });
}
