interface FluxoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Isotipo de Fluxo: tres chevrones que crecen hacia la derecha, evocando el
 * flujo continuo de mercancía (entradas/salidas/transferencias) que es el
 * concepto central del sistema. Funciona a cualquier tamaño, de favicon
 * (16px) a avatar de login (72px).
 */
export function FluxoMark({ size = 32, className }: FluxoMarkProps) {
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
        <linearGradient id="fluxo-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#234a3b" />
          <stop offset="100%" stopColor="#1a362b" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#fluxo-mark-bg)" />
      <path d="M7 9 L13 16 L7 23" stroke="#dff7e8" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <path d="M13 9 L19 16 L13 23" stroke="#dff7e8" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <path d="M19 9 L25 16 L19 23" stroke="#2ecc71" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
