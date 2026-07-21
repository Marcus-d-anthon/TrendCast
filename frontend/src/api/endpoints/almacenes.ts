import { apiRequest } from '../http-client';
import type { Almacen } from '../types/domain';

export const almacenesApi = {
  listar: () => apiRequest<Almacen[]>('/almacenes'),
};
