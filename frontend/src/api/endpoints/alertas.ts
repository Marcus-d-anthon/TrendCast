import { apiRequest } from '../http-client';
import type { Alerta } from '../types/domain';

export const alertasApi = {
  listar: () => apiRequest<Alerta[]>('/alertas'),
};
