import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { TrendCastMark } from '../../components/brand/TrendCastMark';
import { TrendCastWordmark } from '../../components/brand/TrendCastWordmark';
import { ApiError } from '../../api/http-client';
import { useAuth } from '../../auth/useAuth';
import { InventoryIllustration } from './InventoryIllustration';
import styles from './LoginPage.module.css';

const PITCH_ITEMS = [
  { glyph: '↳', text: 'Libro de movimientos inmutable, con trazabilidad completa por usuario' },
  { glyph: '△', text: 'Proyección de demanda con promedio móvil y regresión lineal' },
  { glyph: '◇', text: 'Auditoría automática de cada mutación del inventario' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <section className={styles.brandPanel}>
        <div className={styles.illustrationLayer}>
          <div className={styles.illustration}>
            <InventoryIllustration />
          </div>
        </div>

        <div className={styles.textLayer}>
          <TrendCastWordmark markSize={34} textSize="var(--text-2xl)" className={styles.wordmark} />
          <p className={styles.pitch}>
            Sistema de Gestión de Inventarios con Análisis Predictivo: Control de Existencias, Movimientos y
            Proyección de Demanda en un mismo lugar.
          </p>
          <div className={styles.pitchList}>
            {PITCH_ITEMS.map((item) => (
              <div className={styles.pitchItem} key={item.text}>
                <span className={styles.pitchGlyph}>{item.glyph}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.avatar}>
            <TrendCastMark size={64} />
          </div>
          <h2 className={styles.cardTitle}>Iniciar sesión</h2>
          <p className={styles.cardSubtitle}>Ingresa con tu cuenta para continuar.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Correo
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className={styles.hint}>Contacta a tu administrador si olvidaste tu contraseña.</p>
        </div>
      </section>
    </div>
  );
}
