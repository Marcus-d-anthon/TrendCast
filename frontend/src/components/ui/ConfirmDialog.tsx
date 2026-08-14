import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onClose,
  loading,
  confirmDisabled,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{message}</p>
      {children && <div style={{ marginTop: 'var(--space-4)' }}>{children}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading || confirmDisabled}>
          {loading ? 'Procesando…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
