import { useQuery } from '@tanstack/react-query';
import { prediccionApi, type PrediccionParams } from '../api/endpoints/prediccion';
import { queryKeys } from './query-keys';

export function usePrediccion(productoId: string | undefined, params: PrediccionParams = {}) {
  return useQuery({
    queryKey: queryKeys.prediccion(productoId ?? '', params),
    queryFn: () => prediccionApi.generar(productoId as string, params),
    enabled: Boolean(productoId),
  });
}
