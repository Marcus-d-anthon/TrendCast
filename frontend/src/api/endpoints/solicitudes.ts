import { apiRequest } from '../http-client';
import type { EstadoSolicitud, Solicitud, TipoSolicitud } from '../types/domain';

export interface ListarSolicitudesParams {
  [key: string]: string | number | boolean | undefined;
  estado?: EstadoSolicitud;
}

export interface CrearSolicitudInput {
  tipo: TipoSolicitud;
  productoId: string;
  almacenId: string;
  cantidad: number;
  comentario?: string;
}

export const solicitudesApi = {
  listar: (params: ListarSolicitudesParams = {}) => apiRequest<Solicitud[]>('/solicitudes', { query: params }),
  crear: (input: CrearSolicitudInput) => apiRequest<Solicitud>('/solicitudes', { method: 'POST', body: input }),
  aprobar: (id: string) => apiRequest<Solicitud>(`/solicitudes/${id}/aprobar`, { method: 'PATCH' }),
  rechazar: (id: string, motivo: string) =>
    apiRequest<Solicitud>(`/solicitudes/${id}/rechazar`, { method: 'PATCH', body: { motivo } }),
  efectuar: (id: string) => apiRequest<Solicitud>(`/solicitudes/${id}/efectuar`, { method: 'PATCH' }),
};
