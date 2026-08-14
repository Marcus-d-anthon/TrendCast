import { apiRequest } from '../http-client';

export interface ErrorLogRegistro {
  id: string;
  mensaje: string;
  ruta: string;
  metodo: string;
  statusCode: number;
  categoria: string | null;
  stackTrace: string | null;
  usuarioId: string | null;
  empresaId: string | null;
  ip: string | null;
  userAgent: string | null;
  traceId: string;
  fecha: string;
  usuario: { id: string; nombre: string; email: string } | null;
  empresa: { id: string; razonSocial: string } | null;
}

export interface ListarErroresParams {
  [key: string]: string | number | boolean | undefined;
  busqueda?: string;
  desde?: string;
  hasta?: string;
}

export const erroresApi = {
  listar: (params: ListarErroresParams) => apiRequest<ErrorLogRegistro[]>('/errores', { query: params }),
};
