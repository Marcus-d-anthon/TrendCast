import { useQuery } from '@tanstack/react-query';
import { erroresApi, type ListarErroresParams } from '../api/endpoints/errores';
import { queryKeys } from './query-keys';

export function useErrores(params: ListarErroresParams) {
  return useQuery({ queryKey: queryKeys.errores(params), queryFn: () => erroresApi.listar(params) });
}
