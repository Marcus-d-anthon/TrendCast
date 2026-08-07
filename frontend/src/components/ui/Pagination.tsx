import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

interface PaginationProps {
  pagina: number;
  totalPaginas: number;
  totalItems: number;
  onCambiarPagina: (pagina: number) => void;
}

const TAMANO_PAGINA = 10;

// Genera la lista de "botones" a mostrar: siempre primera y ultima pagina,
// la actual con un vecino a cada lado, y "…" donde se salta un tramo largo
// -- evita que una tabla con 40 paginas dibuje 40 botones.
function construirRangoVisible(pagina: number, totalPaginas: number): (number | '…')[] {
  const rango = new Set<number>([1, totalPaginas, pagina, pagina - 1, pagina + 1]);
  const paginas = [...rango].filter((p) => p >= 1 && p <= totalPaginas).sort((a, b) => a - b);

  const resultado: (number | '…')[] = [];
  paginas.forEach((p, i) => {
    if (i > 0 && p - paginas[i - 1] > 1) resultado.push('…');
    resultado.push(p);
  });
  return resultado;
}

export function Pagination({ pagina, totalPaginas, totalItems, onCambiarPagina }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const desde = (pagina - 1) * TAMANO_PAGINA + 1;
  const hasta = Math.min(pagina * TAMANO_PAGINA, totalItems);

  return (
    <nav className={styles.wrap} aria-label="Paginación">
      <span className={styles.resumen}>
        {desde}–{hasta} de {totalItems}
      </span>

      <div className={styles.controles}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => onCambiarPagina(pagina - 1)}
          disabled={pagina === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {construirRangoVisible(pagina, totalPaginas).map((item, i) =>
          item === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === pagina ? styles.pageButtonActive : styles.pageButton}
              onClick={() => onCambiarPagina(item)}
              aria-current={item === pagina ? 'page' : undefined}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={styles.navButton}
          onClick={() => onCambiarPagina(pagina + 1)}
          disabled={pagina === totalPaginas}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export const TAMANO_PAGINA_DEFECTO = TAMANO_PAGINA;

/** Recorta `items` a la pagina pedida (paginacion en cliente para listas ya cargadas por completo). */
export function paginar<T>(items: T[], pagina: number, tamano = TAMANO_PAGINA): T[] {
  const inicio = (pagina - 1) * tamano;
  return items.slice(inicio, inicio + tamano);
}
