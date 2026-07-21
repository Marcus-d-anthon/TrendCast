import { useQuery } from '@tanstack/react-query';
import { marcasApi } from '../api/endpoints/marcas';
import { queryKeys } from './query-keys';

export function useMarcas() {
  return useQuery({ queryKey: queryKeys.marcas, queryFn: marcasApi.listar });
}
