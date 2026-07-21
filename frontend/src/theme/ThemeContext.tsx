import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fluxo-theme';

function sistemaPrefiereOscuro(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function leerTemaGuardado(): Theme | null {
  const guardado = localStorage.getItem(STORAGE_KEY);
  return guardado === 'light' || guardado === 'dark' ? guardado : null;
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // El script inline en index.html ya aplico [data-theme] en <html> antes del
  // primer paint (evita el flash de tema incorrecto); aqui solo se sincroniza
  // el estado de React con lo que ya quedo escrito en el DOM.
  const [theme, setTheme] = useState<Theme>(() => {
    const guardado = leerTemaGuardado();
    if (guardado) return guardado;
    return sistemaPrefiereOscuro() ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((actual) => (actual === 'dark' ? 'light' : 'dark'));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
