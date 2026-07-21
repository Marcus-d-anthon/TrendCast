import { apiRequest } from '../http-client';
import type { Cliente } from '../types/domain';

export const clientesApi = {
  listar: () => apiRequest<Cliente[]>('/clientes'),
};
