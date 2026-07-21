import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Movimiento } from '../../api/types/domain';
import { MovementTapeItem } from './MovementTapeItem';
import styles from './MovementTape.module.css';

interface LinkPath {
  id: string;
  d: string;
}

interface MovementTapeProps {
  movimientos: Movimiento[];
}

const SPINE_X = 20;

export function MovementTape({ movimientos }: MovementTapeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const [links, setLinks] = useState<LinkPath[]>([]);

  const movimientosPorId = useMemo(() => new Map(movimientos.map((m) => [m.id, m])), [movimientos]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const wrapRect = wrap.getBoundingClientRect();
    const nextLinks: LinkPath[] = [];

    for (const mov of movimientos) {
      if (mov.tipo !== 'AJUSTE' || !mov.movimientoOrigenId) continue;
      const origenEl = rowRefs.current.get(mov.movimientoOrigenId);
      const ajusteEl = rowRefs.current.get(mov.id);
      if (!origenEl || !ajusteEl) continue;

      const origenRect = origenEl.getBoundingClientRect();
      const ajusteRect = ajusteEl.getBoundingClientRect();
      const y1 = origenRect.top - wrapRect.top + origenRect.height / 2;
      const y2 = ajusteRect.top - wrapRect.top + ajusteRect.height / 2;

      // Arco hacia la izquierda de la espina, curvatura proporcional a la
      // distancia entre las dos filas (mas separadas = arco mas ancho).
      const curvatura = Math.min(36, Math.max(16, Math.abs(y2 - y1) / 3));
      const x = SPINE_X - 10;
      const d = `M ${x} ${y1} C ${x - curvatura} ${y1}, ${x - curvatura} ${y2}, ${x} ${y2}`;
      nextLinks.push({ id: mov.id, d });
    }

    setLinks(nextLinks);
  }, [movimientos]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <svg className={styles.linkLayer} aria-hidden="true">
        {links.map((link) => (
          <path key={link.id} d={link.d} className={styles.linkPath} />
        ))}
      </svg>
      <ul className={styles.list}>
        {movimientos.map((mov) => (
          <MovementTapeItem
            key={mov.id}
            movimiento={mov}
            origen={mov.movimientoOrigenId ? movimientosPorId.get(mov.movimientoOrigenId) : undefined}
            rowRef={(el) => {
              if (el) rowRefs.current.set(mov.id, el);
              else rowRefs.current.delete(mov.id);
            }}
          />
        ))}
      </ul>
    </div>
  );
}
