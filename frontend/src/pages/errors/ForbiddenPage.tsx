import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import styles from './ErrorScreen.module.css';

export function ForbiddenPage() {
  return (
    <div className={styles.screen}>
      <span className={styles.code}>403</span>
      <h1 className={styles.title}>No tienes acceso a esta sección</h1>
      <p className={styles.message}>Tu rol actual no incluye esta funcionalidad. Contacta a un administrador si crees que es un error.</p>
      <Link to="/">
        <Button variant="secondary">Volver al dashboard</Button>
      </Link>
    </div>
  );
}
