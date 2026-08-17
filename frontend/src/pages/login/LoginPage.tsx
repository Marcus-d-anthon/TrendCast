import { Eye, EyeOff, ScrollText, ShieldCheck, TrendingUp, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { TrendCastWordmark } from '../../components/brand/TrendCastWordmark';
import { ApiError } from '../../api/http-client';
import { useAuth } from '../../auth/useAuth';
import styles from './LoginPage.module.css';

const PITCH_ITEMS: { icon: LucideIcon; text: string }[] = [
  { icon: ShieldCheck, text: 'Libro de movimientos inmutable, con trazabilidad por usuario' },
  { icon: TrendingUp, text: 'Proyección de demanda con promedio móvil y regresión lineal' },
  { icon: ScrollText, text: 'Auditoría automática de cada mutación del inventario' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigoTotp, setCodigoTotp] = useState('');
  const [pideCodigo, setPideCodigo] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resultado = await login(email, password, pideCodigo ? codigoTotp : undefined);
      if (resultado.requiere2fa) {
        setPideCodigo(true);
        return;
      }
      // Siempre al dashboard, sin importar que pestaña/ruta tuviera abierta
      // el usuario antes de que la sesion expirara -- entrar de nuevo no
      // deberia devolverlo a donde estaba, sino al punto de partida normal.
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
      // Un codigo invalido no debe obligar a retipear la contrasena.
      if (pideCodigo) setCodigoTotp('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <section className={styles.brandPanel}>
        <div className={styles.brandInner}>
          <TrendCastWordmark markSize={32} textSize="var(--text-xl)" className={styles.wordmark} />
          <h1 className={styles.headline}>Inventario bajo control, demanda bajo previsión.</h1>
          <p className={styles.pitch}>
            Gestión de existencias, movimientos y proyección de demanda en un mismo lugar.
          </p>
          <div className={styles.pitchList}>
            {PITCH_ITEMS.map(({ icon: Icono, text }) => (
              <div className={styles.pitchItem} key={text}>
                <span className={styles.pitchIcon}>
                  <Icono size={18} aria-hidden="true" />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.card}>
          <TrendCastWordmark markSize={30} textSize="var(--text-xl)" className={styles.mobileMark} />
          <h2 className={styles.cardTitle}>{pideCodigo ? 'Verificación en dos pasos' : 'Iniciar sesión'}</h2>
          <p className={styles.cardSubtitle}>
            {pideCodigo
              ? 'Ingresa el código de tu app de autenticación (o uno de tus códigos de respaldo).'
              : 'Ingresa con tu cuenta para continuar.'}
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            {!pideCodigo && (
              <>
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
                  <div className={styles.passwordWrap}>
                    <input
                      id="password"
                      type={mostrarPassword ? 'text' : 'password'}
                      className={styles.input}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setMostrarPassword((v) => !v)}
                      aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={mostrarPassword}
                      tabIndex={-1}
                    >
                      {mostrarPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {pideCodigo && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="codigoTotp">
                  Código de verificación
                </label>
                <input
                  id="codigoTotp"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  className={styles.input}
                  value={codigoTotp}
                  onChange={(e) => setCodigoTotp(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            )}

            <Button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Verificando…' : pideCodigo ? 'Verificar' : 'Ingresar'}
            </Button>

            {pideCodigo && (
              <button
                type="button"
                className={styles.backLink}
                onClick={() => {
                  setPideCodigo(false);
                  setCodigoTotp('');
                  setError(null);
                }}
              >
                ← Volver a ingresar credenciales
              </button>
            )}
          </form>

          <p className={styles.hint}>Contacta a tu administrador si olvidaste tu contraseña.</p>
        </div>
      </section>
    </div>
  );
}
