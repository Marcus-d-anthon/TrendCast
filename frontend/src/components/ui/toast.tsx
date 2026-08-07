import { CheckCircle2, XCircle } from 'lucide-react';
import toastLib, { Toaster } from 'react-hot-toast';

/**
 * Wrapper delgado sobre react-hot-toast: fija el estilo (tokens del sistema,
 * no el look por defecto de la libreria) e iconos consistentes con el resto
 * de la app (lucide-react). Usar `toast.success` / `toast.error`, nunca
 * `react-hot-toast` directamente, para que todas las notificaciones se vean
 * iguales.
 */
export const toast = {
  success: (mensaje: string) =>
    toastLib.success(mensaje, {
      icon: <CheckCircle2 size={18} color="var(--color-success)" strokeWidth={2.5} />,
    }),
  error: (mensaje: string) =>
    toastLib.error(mensaje, {
      icon: <XCircle size={18} color="var(--color-danger)" strokeWidth={2.5} />,
    }),
};

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-3) var(--space-4)',
        },
        success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-surface)' } },
        error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-surface)' } },
      }}
    />
  );
}
