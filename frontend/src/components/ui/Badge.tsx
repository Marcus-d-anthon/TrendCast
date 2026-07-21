import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return <span className={[styles.badge, styles[variant], className].filter(Boolean).join(' ')} {...props} />;
}
