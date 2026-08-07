interface TrendCastMarkProps {
  size?: number;
  className?: string;
}

/**
 * Isotipo de TrendCast: tres chevrones que crecen hacia la derecha, evocando
 * tanto el flujo continuo de mercancia (entradas/salidas/transferencias)
 * como una linea de tendencia proyectandose hacia adelante -- el concepto
 * central del modulo predictivo. Funciona a cualquier tamano, de favicon
 * (16px) a avatar de login (72px).
 */
export function TrendCastMark({ size = 32, className }: TrendCastMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="trendcast-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#241E5C" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#trendcast-mark-bg)" />
      <path d="M7 9 L13 16 L7 23" stroke="#E8E5FC" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <path d="M13 9 L19 16 L13 23" stroke="#E8E5FC" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <path d="M19 9 L25 16 L19 23" stroke="#8B7FFB" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
