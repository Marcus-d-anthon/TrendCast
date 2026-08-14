import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { TrendCastMark } from '../../components/brand/TrendCastMark';
import { TrendCastWordmark } from '../../components/brand/TrendCastWordmark';
import { ApiError } from '../../api/http-client';
import { useAuth } from '../../auth/useAuth';
import styles from './LoginPage.module.css';

const PITCH_ITEMS = [
  { glyph: '↳', text: 'Libro de movimientos inmutable, con trazabilidad completa por usuario' },
  { glyph: '△', text: 'Proyección de demanda con promedio móvil y regresión lineal' },
  { glyph: '◇', text: 'Auditoría automática de cada mutación del inventario' },
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
