import { useQuery } from '@tanstack/react-query';
import { proveedoresApi } from '../api/endpoints/proveedores';
import { queryKeys } from './query-keys';

export function useProveedores() {
  return useQuery({ queryKey: queryKeys.proveedores, queryFn: proveedoresApi.listar });
}
