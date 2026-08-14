import { apiRequest } from '../http-client';

export type AccionAuditoria = 'CREATE' | 'UPDATE' | 'SOFT_DELETE' | 'LOGIN';

export interface AuditoriaRegistro {
  id: string;
  entidad: string;
  registroId: string;
  accion: AccionAuditoria;
  valorAnterior: Record<string, unknown> | null;
  valorNuevo: Record<string, unknown> | null;
  usuarioId: string | null;
  fecha: string;
  actor: { id: string; nombre: string; email: string } | null;
}

export interface ListarAuditoriaParams {
  [key: string]: string | number | boolean | undefined;
  entidad: string;
  registroId: string;
}

export const auditoriaApi = {
  listar: (params: ListarAuditoriaParams) => apiRequest<AuditoriaRegistro[]>('/auditoria', { query: params }),
};
