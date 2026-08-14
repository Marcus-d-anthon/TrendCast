import type { Usuario } from './types';

const TOKEN_KEY = 'sgi.auth.token';
const REFRESH_KEY = 'sgi.auth.refreshToken';
const USUARIO_KEY = 'sgi.auth.usuario';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getUsuario(): Usuario | null {
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function setAuth(token: string, usuario: Usuario, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

// Actualiza solo el usuario cacheado (sin tocar los tokens) -- para cuando
// algo cambia en el perfil sin pasar por login/refresh, ej. activar 2FA.
export function updateUsuarioCache(usuario: Usuario): void {
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USUARIO_KEY);
}
