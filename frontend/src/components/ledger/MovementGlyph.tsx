import type { TipoMovimiento } from '../../api/types/domain';

const COLOR_VAR: Record<TipoMovimiento, string> = {
  ENTRADA: 'var(--color-entrada)',
  SALIDA: 'var(--color-salida)',
  AJUSTE: 'var(--color-ajuste)',
  TRANSFERENCIA: 'var(--color-transferencia)',
};

// Triangulo arriba (ENTRADA), triangulo abajo (SALIDA), rombo (AJUSTE),
// cuadrado (TRANSFERENCIA): cuatro formas distintas, no solo colores --
// reconocibles incluso en miniatura o para quien no distingue bien los
// colores.
const SHAPE_POINTS: Record<TipoMovimiento, string> = {
  ENTRADA: '10,5 15,14 5,14',
  SALIDA: '10,15 15,6 5,6',
  AJUSTE: '10,4 16,10 10,16 4,10',
  TRANSFERENCIA: '5,5 15,5 15,15 5,15',
};

interface MovementGlyphProps {
  tipo: TipoMovimiento;
  size?: number;
}

export function MovementGlyph({ tipo, size = 20 }: MovementGlyphProps) {
  const color = COLOR_VAR[tipo];

  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx={10} cy={10} r={9.5} fill={color} fillOpacity={0.14} />
      <polygon points={SHAPE_POINTS[tipo]} fill={color} />
    </svg>
  );
}
