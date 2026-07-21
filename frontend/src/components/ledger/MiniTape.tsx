import type { Movimiento } from '../../api/types/domain';
import { formatDateTime } from '../../utils/format';
import { MovementGlyph } from './MovementGlyph';
import styles from './MiniTape.module.css';

interface MiniTapeProps {
  movimientos: Movimiento[];
}

const SIGNO: Record<Movimiento['tipo'], string> = { ENTRADA: '+', SALIDA: '−', AJUSTE: '=', TRANSFERENCIA: '⇄' };

export function MiniTape({ movimientos }: MiniTapeProps) {
  return (
    <ul className={styles.list}>
      {movimientos.map((mov) => (
        <li key={mov.id} className={styles.row} title={`${mov.tipo} · ${formatDateTime(mov.fecha)}`}>
          <MovementGlyph tipo={mov.tipo} size={18} />
          <div className={styles.rowText}>
            <span className={styles.rowProduct}>{mov.producto?.nombre ?? mov.productoId}</span>
            <span className={styles.rowMeta}>
              {SIGNO[mov.tipo]}
              {mov.cantidad} · {formatDateTime(mov.fecha)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
