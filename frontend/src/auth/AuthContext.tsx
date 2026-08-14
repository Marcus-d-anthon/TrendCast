import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { apiRequest, registerUnauthorizedHandler } from '../api/http-client';
import { toast } from '../components/ui/toast';
import { roleLabels } from '../utils/role-labels';
import { obtenerExpiracionMs } from './jwt';
import { SessionTimeoutModal } from './SessionTimeoutModal';
import { clearAuth, getRefreshToken, getToken, getUsuario, setAuth, updateUsuarioCache } from './token-storage';
import type { Usuario } from './types';

const formateadorHora = new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit' });

// El JWT de acceso dura 22 min (ver backend/.env JWT_EXPIRES_IN). Se avisa
// 2 min antes de que expire, dando tiempo real de reaccionar sin sentirse
// prematuro dentro de una sesión tan corta.
const AVISO_ANTES_MS = 2 * 60 * 1000;

// Union: si la cuenta tiene 2FA activado y no llego codigoTotp, el backend
// responde solo {requiere2fa:true} sin emitir tokens (ver AuthService.login).
interface LoginResponse {
  requiere2fa?: true;
  token?: string;
  refreshToken?: string;
  usuario?: Usuario;
}

// /auth/refresh no pasa por el paso de 2FA (reutiliza una sesion ya
// autenticada), asi que su respuesta siempre trae los 3 campos.
interface RefrescarResponse {
  token: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface LoginResult {
  requiere2fa: boolean;
}

interface AuthContextValue {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, codigoTotp?: string) => Promise<LoginResult>;
  logout: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Hidratacion sincrona desde localStorage: no existe GET /auth/me, asi que
  // se confia en el usuario cacheado del login y se detecta la expiracion
  // del token de forma perezosa (primer 401 -> logout automatico).
  const [usuario, setUsuario] = useState<Usuario | null>(() => getUsuario());
  const [hasToken, setHasToken] = useState<boolean>(() => getToken() !== null);
  const [expiraEn, setExpiraEn] = useState<number | null>(() => {
    const token = getToken();
    return token ? obtenerExpiracionMs(token) : null;
  });
  const [mostrarPrompt, setMostrarPrompt] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const logout = useCallback(() => {
    clearAuth();
    setUsuario(null);
    setHasToken(false);
    setExpiraEn(null);
    setMostrarPrompt(false);
  }, []);

  useEffect(() => {
    // Distinto del boton "Cerrar sesion": esto dispara cuando el token expira
    // o se revoca a mitad de sesion, asi que si merece avisar por que se
    // volvio a la pantalla de login.
    registerUnauthorizedHandler(() => {
      logout();
      toast.error('Tu sesión expiró. Inicia sesión de nuevo.');
    });
  }, [logout]);

  const login = useCallback(async (email: string, password: string, codigoTotp?: string): Promise<LoginResult> => {
    const result = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password, codigoTotp },
    });
    if (result.requiere2fa || !result.token || !result.usuario) {
      return { requiere2fa: true };
    }
    setAuth(result.token, result.usuario, result.refreshToken);
    setUsuario(result.usuario);
    setHasToken(true);
    setExpiraEn(obtenerExpiracionMs(result.token));
    setMostrarPrompt(false);
    toast.success(
      `Accediste como ${roleLabels[result.usuario.rol]} · ${result.usuario.nombre} · ${formateadorHora.format(new Date())}`,
    );
    return { requiere2fa: false };
  }, []);

  // Para cambios de perfil que no pasan por login/refresh (ej. activar o
  // desactivar 2FA): actualiza el estado en memoria y el cache local sin
  // tocar los tokens vigentes.
  const actualizarUsuario = useCallback((actualizado: Usuario) => {
    updateUsuarioCache(actualizado);
    setUsuario(actualizado);
  }, []);

  // Extiende la sesion vigente en vez de dejarla expirar en silencio: rota
  // el refresh token (backend/AuthService.refrescar) y reprograma los
  // temporizadores de aviso/expiracion a partir del nuevo token.
  const continuarSesion = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      logout();
      return;
    }
    setRefrescando(true);
    try {
      const result = await apiRequest<RefrescarResponse>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
      });
      setAuth(result.token, result.usuario, result.refreshToken);
      setUsuario(result.usuario);
      setExpiraEn(obtenerExpiracionMs(result.token));
      setMostrarPrompt(false);
      toast.success('Sesión extendida');
    } catch {
      toast.error('No se pudo extender la sesión');
      logout();
    } finally {
      setRefrescando(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!expiraEn) return;

    const ahora = Date.now();
    const msHastaExpirar = expiraEn - ahora;
    if (msHastaExpirar <= 0) {
      logout();
      return;
    }

    const msHastaAviso = Math.max(0, expiraEn - AVISO_ANTES_MS - ahora);
    const timerAviso = setTimeout(() => setMostrarPrompt(true), msHastaAviso);
    const timerExpira = setTimeout(() => {
      logout();
      toast.error('Tu sesión expiró por inactividad.');
    }, msHastaExpirar);

    return () => {
      clearTimeout(timerAviso);
      clearTimeout(timerExpira);
    };
  }, [expiraEn, logout]);

  return (
    <AuthContext.Provider value={{ usuario, isAuthenticated: hasToken, login, logout, actualizarUsuario }}>
      {children}
      {mostrarPrompt && (
        <SessionTimeoutModal
          segundosIniciales={Math.floor(AVISO_ANTES_MS / 1000)}
          cargando={refrescando}
          onContinuar={continuarSesion}
          onCerrarSesion={() => {
            logout();
            toast.success('Sesión cerrada.');
          }}
        />
      )}
    </AuthContext.Provider>
  );
}
