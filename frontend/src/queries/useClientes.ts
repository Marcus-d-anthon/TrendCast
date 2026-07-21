import { useQuery } from '@tanstack/react-query';
import { clientesApi } from '../api/endpoints/clientes';
import { queryKeys } from './query-keys';

export function useClientes() {
  return useQuery({ queryKey: queryKeys.clientes, queryFn: clientesApi.listar });
}
