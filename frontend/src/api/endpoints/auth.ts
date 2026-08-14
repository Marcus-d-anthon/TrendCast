import { apiRequest } from '../http-client';

export interface Configurar2faResponse {
  qr: string;
  secret: string;
}

export interface Verificar2faResponse {
  codigosRecuperacion: string[];
}

export const authApi = {
  configurar2fa: () => apiRequest<Configurar2faResponse>('/auth/2fa/configurar', { method: 'POST' }),
  verificar2fa: (codigo: string) => apiRequest<Verificar2faResponse>('/auth/2fa/verificar', { method: 'POST', body: { codigo } }),
  desactivar2fa: (password: string) => apiRequest<void>('/auth/2fa/desactivar', { method: 'POST', body: { password } }),
};
