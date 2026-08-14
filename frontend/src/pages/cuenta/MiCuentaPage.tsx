import { Check, Copy, ShieldCheck, ShieldOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints/auth';
import { ApiError } from '../../api/http-client';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/toast';
import styles from './MiCuentaPage.module.css';

type Paso = 'inicial' | 'escanear' | 'codigosRespaldo';

// El codigo se guarda sin espacios en el estado (para que `codigo.length`
// siga midiendo digitos reales); esto solo formatea lo que se muestra.
function formatearCodigo(digitos: string): string {
  return digitos.length > 3 ? `${digitos.slice(0, 3)} ${digitos.slice(3)}` : digitos;
}

export function MiCuentaPage() {
  const { usuario, actualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState<Paso>('inicial');
  const [qr, setQr] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [codigosRespaldo, setCodigosRespaldo] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [password, setPassword] = useState('');

  if (!usuario) return null;

  async function iniciarActivacion() {
    setCargando(true);
    try {
      const res = await authApi.configurar2fa();
      setQr(res.qr);
      setPaso('escanear');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo generar el código QR');
    } finally {
      setCargando(false);
    }
  }

  function alEnviarCodigo(event: FormEvent) {
    event.preventDefault();
    if (codigo.length === 6 && !cargando) verificarYActivar();
  }

  async function verificarYActivar() {
    setCargando(true);
    try {
      const res = await authApi.verificar2fa(codigo);
      setCodigosRespaldo(res.codigosRecuperacion);
      setPaso('codigosRespaldo');
      // usuario ya se valido no-nulo arriba, pero TS no propaga ese
      // estrechamiento dentro de una funcion anidada -- de ahi el "!".
      actualizarUsuario({ ...usuario!, totpHabilitado: true });
      toast.success('Verificación en dos pasos activada');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Código inválido');
    } finally {
      setCargando(false);
    }
  }

  async function confirmarDesactivar() {
    setCargando(true);
    try {
      await authApi.desactivar2fa(password);
      actualizarUsuario({ ...usuario!, totpHabilitado: false });
      toast.success('Verificación en dos pasos desactivada');
      // En vez de dejar la pantalla mostrando el estado recien revertido
      // (raro: "aqui mismo puedes volver a activarla"), se vuelve al
      // dashboard -- para reactivarla el usuario entra de nuevo por su
      // propia cuenta.
      navigate('/');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo desactivar');
    } finally {
      setCargando(false);
    }
  }

  function copiarCodigos() {
    navigator.clipboard.writeText(codigosRespaldo.join('\n')).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function cerrarYReiniciar() {
    setPaso('inicial');
    setQr(null);
    setCodigo('');
    setCodigosRespaldo([]);
  }

  return (
    <div className={styles.wrap}>
      <Card>
        <div className={styles.header}>
          <h2 className={styles.title}>Seguridad de la cuenta</h2>
          <p className={styles.subtitle}>{usuario.email}</p>
          <Badge variant={usuario.totpHabilitado ? 'success' : 'neutral'}>
            {usuario.totpHabilitado ? 'Verificación en dos pasos activada' : 'Verificación en dos pasos desactivada'}
          </Badge>
        </div>

        <p className={styles.descripcion}>
          Agrega una capa extra de protección: además de tu contraseña, se te pedirá un código de tu app de
          autenticación (Google Authenticator, Authy, etc.) al iniciar sesión.
        </p>

        {!usuario.totpHabilitado && paso === 'inicial' && (
          <div className={styles.accionPrincipal}>
            <Button onClick={iniciarActivacion} disabled={cargando}>
              <ShieldCheck size={16} aria-hidden="true" /> Activar verificación en dos pasos
            </Button>
          </div>
        )}

        {usuario.totpHabilitado && (
          <div className={styles.accionPrincipal}>
            <Button variant="danger" onClick={() => setDesactivando(true)}>
              <ShieldOff size={16} aria-hidden="true" /> Desactivar verificación en dos pasos
            </Button>
          </div>
        )}

        {paso === 'escanear' && qr && (
          <form className={styles.setup} onSubmit={alEnviarCodigo}>
            <p className={styles.setupHint}>
              Escanea este código con tu app de autenticación y escribe el código de 6 dígitos que te muestra.
            </p>
            <img src={qr} alt="Código QR para configurar la verificación en dos pasos" className={styles.qr} />
            <FormField label="Código de verificación" htmlFor="codigo-2fa">
              <Input
                id="codigo-2fa"
                className={styles.codigoInput}
                value={formatearCodigo(codigo)}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000 000"
                autoFocus
              />
            </FormField>
            <div className={styles.setupActions}>
              <Button type="button" variant="secondary" onClick={cerrarYReiniciar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={cargando || codigo.length !== 6}>
                {cargando ? 'Verificando…' : 'Verificar y activar'}
              </Button>
            </div>
          </form>
        )}

        {paso === 'codigosRespaldo' && (
          <div className={styles.setup}>
            <p className={styles.setupHint}>
              Guarda estos códigos de respaldo en un lugar seguro. Cada uno sirve una sola vez y son la única forma
              de entrar si pierdes acceso a tu app de autenticación. No se pueden volver a mostrar.
            </p>
            <div className={styles.codigosGrid}>
              {codigosRespaldo.map((c) => (
                <code key={c} className={styles.codigo}>
                  {c}
                </code>
              ))}
            </div>
            <div className={styles.setupActions}>
              <Button variant="secondary" onClick={copiarCodigos}>
                {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copiado ? 'Copiado' : 'Copiar códigos'}
              </Button>
              <Button onClick={cerrarYReiniciar}>Listo</Button>
            </div>
          </div>
        )}
      </Card>

      {desactivando && (
        <ConfirmDialog
          title="Desactivar verificación en dos pasos"
          message="Confirma tu contraseña para desactivar esta protección. Tu cuenta quedará protegida solo por la contraseña."
          confirmLabel="Desactivar"
          danger
          loading={cargando}
          confirmDisabled={password.length === 0}
          onClose={() => {
            setDesactivando(false);
            setPassword('');
          }}
          onConfirm={confirmarDesactivar}
        >
          <FormField label="Contraseña" htmlFor="password-desactivar-2fa">
            <Input id="password-desactivar-2fa" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </FormField>
        </ConfirmDialog>
      )}
    </div>
  );
}
