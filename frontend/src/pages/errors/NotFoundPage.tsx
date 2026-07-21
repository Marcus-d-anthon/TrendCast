import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import styles from './ErrorScreen.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.screen}>
      <span className={styles.code}>404</span>
      <h1 className={styles.title}>Esta página no existe</h1>
      <p className={styles.message}>Revisa la dirección o vuelve al panel principal.</p>
      <Link to="/">
        <Button variant="secondary">Volver al dashboard</Button>
      </Link>
    </div>
  );
}
