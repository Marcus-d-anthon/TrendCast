import styles from './InventoryIllustration.module.css';

/**
 * Ilustración isométrica original (no reproduce ninguna imagen de
 * referencia): una estantería de bodega con cajas, una pantalla flotante de
 * predicción y formas decorativas, todo con animación continua y sutil vía
 * CSS (translate/rotate en bucle), respetando prefers-reduced-motion.
 * Colores retintados a la paleta TrendCast (indigo/violeta como color de
 * marca, esmeralda y teal como acentos de variedad, ambar para el punto de
 * atencion del grafico predictivo).
 */
export function InventoryIllustration() {
  return (
    <svg
      className={styles.root}
      viewBox="0 0 480 460"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shelf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#241e5c" />
        </linearGradient>
        <linearGradient id="boxA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3ee08c" />
          <stop offset="100%" stopColor="#219150" />
        </linearGradient>
        <linearGradient id="boxB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3fa9b8" />
          <stop offset="100%" stopColor="#145f69" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#332b7a" />
          <stop offset="100%" stopColor="#1c1848" />
        </linearGradient>
      </defs>

      {/* Base / estanteria isometrica */}
      <g transform="translate(40,180)">
        <polygon points="0,60 180,0 360,60 180,120" fill="url(#shelf)" opacity="0.9" />
        <polygon points="0,60 0,110 180,170 180,120" fill="#1c1848" />
        <polygon points="360,60 360,110 180,170 180,120" fill="#15123a" />
      </g>

      {/* Cajas flotantes con animacion de vaiven */}
      <g className={styles.floatSlow}>
        <g transform="translate(95,150)">
          <polygon points="0,20 40,0 80,20 40,40" fill="url(#boxA)" />
          <polygon points="0,20 0,55 40,75 40,40" fill="#1c7a44" />
          <polygon points="80,20 80,55 40,75 40,40" fill="#166339" />
        </g>
      </g>

      <g className={styles.floatMed}>
        <g transform="translate(190,120)">
          <polygon points="0,20 42,0 84,20 42,40" fill="url(#boxB)" />
          <polygon points="0,20 0,58 42,78 42,40" fill="#114f57" />
          <polygon points="84,20 84,58 42,78 42,40" fill="#0d3f45" />
        </g>
      </g>

      <g className={styles.floatFast}>
        <g transform="translate(275,158)">
          <polygon points="0,18 36,0 72,18 36,36" fill="url(#boxA)" />
          <polygon points="0,18 0,50 36,68 36,36" fill="#1c7a44" />
          <polygon points="72,18 72,50 36,68 36,36" fill="#166339" />
        </g>
      </g>

      {/* Pantalla flotante con mini-grafico de prediccion */}
      <g className={styles.floatMed} transform="translate(150,20)">
        <rect x="0" y="0" width="190" height="120" rx="14" fill="url(#screenGrad)" stroke="#8b7ffb" strokeOpacity="0.5" />
        <polyline
          points="16,90 50,70 84,78 118,45 152,55 174,28"
          fill="none"
          stroke="#8b7ffb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="16,90 50,70 84,78 118,45 152,55 174,28"
          fill="none"
          stroke="#8b7ffb"
          strokeOpacity="0.25"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="174" cy="28" r="5" fill="#d98c1f" />
      </g>

      {/* Formas decorativas: rotan lentamente */}
      <g className={styles.spinSlow} transform="translate(60,60)">
        <polygon points="0,-14 12,7 -12,7" fill="none" stroke="#8b7ffb" strokeWidth="3" />
      </g>
      <g className={styles.spinReverse} transform="translate(400,90)">
        <circle r="10" fill="none" stroke="#d98c1f" strokeWidth="3" />
      </g>
      <g className={styles.floatFast} transform="translate(410,220)">
        <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#8b7ffb" opacity="0.8" />
      </g>
      <g className={styles.floatSlow} transform="translate(30,290)">
        <circle r="7" fill="#3ee08c" opacity="0.8" />
      </g>
    </svg>
  );
}
