import { TrendCastMark } from './TrendCastMark';
import styles from './TrendCastWordmark.module.css';

interface TrendCastWordmarkProps {
  markSize?: number;
  textSize?: string;
  className?: string;
}

export function TrendCastWordmark({ markSize = 28, textSize = 'var(--text-xl)', className }: TrendCastWordmarkProps) {
  return (
    <span className={[styles.wordmark, className].filter(Boolean).join(' ')}>
      <TrendCastMark size={markSize} />
      <span className={styles.text} style={{ fontSize: textSize }}>
        TrendCast
      </span>
    </span>
  );
}
