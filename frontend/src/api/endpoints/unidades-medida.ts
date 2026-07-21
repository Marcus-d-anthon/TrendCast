import { apiRequest } from '../http-client';
import type { UnidadMedida } from '../types/domain';

export const unidadesMedidaApi = {
  listar: () => apiRequest<UnidadMedida[]>('/unidades-medida'),
};
