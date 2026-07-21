import { apiRequest } from '../http-client';
import type { Proveedor } from '../types/domain';

export const proveedoresApi = {
  listar: () => apiRequest<Proveedor[]>('/proveedores'),
};
