import { AlertOctagon } from 'lucide-react';
import { Button } from './Button';
import styles from './StateMessage.module.css';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'No se pudo cargar la información',
  description = 'Ocurrió un problema al conectar con el servidor. Intenta de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.state}>
      <AlertOctagon size={32} className={styles.iconDanger} aria-hidden="true" />
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
