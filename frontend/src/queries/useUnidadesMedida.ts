import { useQuery } from '@tanstack/react-query';
import { unidadesMedidaApi } from '../api/endpoints/unidades-medida';
import { queryKeys } from './query-keys';

export function useUnidadesMedida() {
  return useQuery({ queryKey: queryKeys.unidadesMedida, queryFn: unidadesMedidaApi.listar });
}
