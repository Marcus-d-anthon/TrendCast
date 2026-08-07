import { useEffect, useState } from 'react';

/**
 * Devuelve `valor` retrasado `delayMs`, y solo lo "libera" cuando tiene 0
 * caracteres (campo vacio, para poder limpiar el filtro al instante) o al
 * menos `minLength` caracteres -- asi una busqueda no dispara una consulta
 * por cada letra de una palabra corta que de todas formas no acota nada.
 */
export function useDebouncedValue(valor: string, delayMs = 350, minLength = 3): string {
  const [debounced, setDebounced] = useState(valor.length === 0 || valor.length >= minLength ? valor : '');

  useEffect(() => {
    if (valor.length > 0 && valor.length < minLength) {
      return;
    }
    const timeout = setTimeout(() => setDebounced(valor), delayMs);
    return () => clearTimeout(timeout);
  }, [valor, delayMs, minLength]);

  return debounced;
}
