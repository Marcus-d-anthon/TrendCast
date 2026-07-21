import type { Movimiento } from '../../api/types/domain';
import { formatDateTime } from '../../utils/format';
import { MovementGlyph } from './MovementGlyph';
import styles from './MovementTape.module.css';

const SIGNO: Record<Movimiento['tipo'], string> = { ENTRADA: '+', SALIDA: '−', AJUSTE: '=', TRANSFERENCIA: '⇄' };
const AMOUNT_CLASS: Record<Movimiento['tipo'], string> = {
  ENTRADA: styles.amountEntrada,
  SALIDA: styles.amountSalida,
  AJUSTE: styles.amountAjuste,
  TRANSFERENCIA: styles.amountTransferencia,
};

interface MovementTapeItemProps {
  movimiento: Movimiento;
  origen?: Movimiento;
  rowRef: (el: HTMLLIElement | null) => void;
}

export function MovementTapeItem({ movimiento, origen, rowRef }: MovementTapeItemProps) {
  return (
    <li ref={rowRef} className={styles.row} data-movimiento-id={movimiento.id}>
      <span className={styles.glyphSlot}>
        <MovementGlyph tipo={movimiento.tipo} />
      </span>

      <div className={styles.top}>
        <span className={styles.product}>
          {movimiento.producto?.nombre ?? movimiento.productoId}
          <span className={styles.sku}>{movimiento.producto?.sku}</span>
        </span>
        <span className={`${styles.amount} ${AMOUNT_CLASS[movimiento.tipo]}`}>
          {SIGNO[movimiento.tipo]}
          {movimiento.cantidad} · saldo {movimiento.saldoResultante}
        </span>
      </div>

      <div className={styles.meta}>
        <span>{formatDateTime(movimiento.fecha)}</span>
        {(movimiento.referencia || movimiento.motivo) && (
          <span className={styles.metaSeparator}>{movimiento.referencia || movimiento.motivo}</span>
        )}
        {movimiento.usuario && <span className={styles.metaSeparator}>{movimiento.usuario.nombre}</span>}
      </div>

      {movimiento.tipo === 'AJUSTE' && movimiento.movimientoOrigenId && (
        <div className={styles.adjustmentNote}>
          ↳ Corrige movimiento {origen ? `del ${formatDateTime(origen.fecha)}` : `#${movimiento.movimientoOrigenId.slice(0, 8)}`}
        </div>
      )}
    </li>
  );
}
