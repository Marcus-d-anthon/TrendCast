import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { apiRequest, registerUnauthorizedHandler } from '../api/http-client';
import { clearAuth, getToken, getUsuario, setAuth } from './token-storage';
import type { Usuario } from './types';

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

interface AuthContextValue {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Hidratacion sincrona desde localStorage: no existe GET /auth/me, asi que
  // se confia en el usuario cacheado del login y se detecta la expiracion
  // del token de forma perezosa (primer 401 -> logout automatico).
  const [usuario, setUsuario] = useState<Usuario | null>(() => getUsuario());
  const [hasToken, setHasToken] = useState<boolean>(() => getToken() !== null);

  const logout = useCallback(() => {
    clearAuth();
    setUsuario(null);
    setHasToken(false);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setAuth(result.token, result.usuario);
    setUsuario(result.usuario);
    setHasToken(true);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, isAuthenticated: hasToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
