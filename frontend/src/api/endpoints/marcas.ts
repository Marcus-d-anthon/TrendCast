import { apiRequest } from '../http-client';
import type { Marca } from '../types/domain';

export const marcasApi = {
  listar: () => apiRequest<Marca[]>('/marcas'),
};
