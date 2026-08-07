import { FluxoMark } from './FluxoMark';
import styles from './FluxoWordmark.module.css';

interface FluxoWordmarkProps {
  markSize?: number;
  textSize?: string;
  className?: string;
}

export function FluxoWordmark({ markSize = 28, textSize = 'var(--text-xl)', className }: FluxoWordmarkProps) {
  return (
    <span className={[styles.wordmark, className].filter(Boolean).join(' ')}>
      <FluxoMark size={markSize} />
      <span className={styles.text} style={{ fontSize: textSize }}>
        Fluxo
      </span>
    </span>
  );
}
