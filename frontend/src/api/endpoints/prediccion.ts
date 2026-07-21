import { apiRequest } from '../http-client';
import type { Granularidad, PrediccionResultado } from '../types/domain';

export interface PrediccionParams {
  [key: string]: string | number | boolean | undefined;
  periodos?: number;
  granularidad?: Granularidad;
}

export const prediccionApi = {
  generar: (productoId: string, params: PrediccionParams = {}) =>
    apiRequest<PrediccionResultado>(`/prediccion/${productoId}`, { query: params }),
};
