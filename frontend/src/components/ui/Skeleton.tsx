import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  return <div className={[styles.skeleton, className].filter(Boolean).join(' ')} style={style} />;
}
