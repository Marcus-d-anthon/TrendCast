import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface SessionTimeoutModalProps {
  segundosIniciales: number;
  cargando: boolean;
  onContinuar: () => void;
  onCerrarSesion: () => void;
}

export function SessionTimeoutModal({ segundosIniciales, cargando, onContinuar, onCerrarSesion }: SessionTimeoutModalProps) {
  const [segundosRestantes, setSegundosRestantes] = useState(segundosIniciales);

  useEffect(() => {
    if (segundosRestantes <= 0) {
      onCerrarSesion();
      return;
    }
    const timer = setTimeout(() => setSegundosRestantes((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [segundosRestantes, onCerrarSesion]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;

  return (
    <Modal title="¿Seguir conectado?" onClose={onCerrarSesion}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        Su sesión está por expirar por inactividad. Si no responde se cerrará automáticamente su sesión en{' '}
        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
          {minutos}:{String(segundos).padStart(2, '0')}
        </strong>
        .
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
        <Button type="button" variant="secondary" onClick={onCerrarSesion} disabled={cargando}>
          Cerrar sesión
        </Button>
        <Button type="button" onClick={onContinuar} disabled={cargando}>
          {cargando ? 'Extendiendo…' : 'Seguir conectado'}
        </Button>
      </div>
    </Modal>
  );
}
