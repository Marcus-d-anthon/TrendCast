import { CheckCircle2, X, XCircle } from 'lucide-react';
import toastLib, { Toaster, type Toast } from 'react-hot-toast';
import styles from './toast.module.css';

// Duracion mas corta que la anterior (4s): con la barra de progreso ya es
// visible cuanto falta para que se retire solo, y un usuario que quiere
// seguir puede cerrarlo con un clic en vez de esperar.
const DURACION_MS = 3000;

function ToastCard({ t, variant, mensaje }: { t: Toast; variant: 'success' | 'error'; mensaje: string }) {
  const Icon = variant === 'success' ? CheckCircle2 : XCircle;
  const color = variant === 'success' ? 'var(--color-success)' : 'var(--color-danger)';
  return (
    <div
      className={styles.card}
      style={{ opacity: t.visible ? 1 : 0 }}
      role="status"
      onClick={() => toastLib.dismiss(t.id)}
      title="Clic para cerrar"
    >
      <Icon size={18} color={color} strokeWidth={2.5} aria-hidden="true" />
      <span className={styles.message}>{mensaje}</span>
      <X size={14} color="var(--color-text-secondary)" aria-hidden="true" />
      {t.visible && (
        <span className={styles.progress} style={{ background: color, animationDuration: `${DURACION_MS}ms` }} />
      )}
    </div>
  );
}

/**
 * Wrapper delgado sobre react-hot-toast: fija el estilo (tokens del sistema,
 * no el look por defecto de la libreria), iconos consistentes con el resto
 * de la app (lucide-react) y una barra de progreso que muestra la cuenta
 * regresiva hasta que se retira solo. Usar `toast.success` / `toast.error`,
 * nunca `react-hot-toast` directamente, para que todas las notificaciones se
 * vean iguales.
 */
export const toast = {
  success: (mensaje: string) =>
    toastLib.custom((t) => <ToastCard t={t} variant="success" mensaje={mensaje} />, { duration: DURACION_MS }),
  error: (mensaje: string) =>
    toastLib.custom((t) => <ToastCard t={t} variant="error" mensaje={mensaje} />, { duration: DURACION_MS }),
};

export function AppToaster() {
  return <Toaster position="top-right" toastOptions={{ duration: DURACION_MS }} />;
}
