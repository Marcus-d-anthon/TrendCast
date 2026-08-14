import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import formStyles from './FormControls.module.css';
import styles from './SearchSelect.module.css';

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Texto adicional para buscar (ej. SKU) sin mostrarse como parte del label. */
  busqueda?: string;
}

interface SearchSelectProps {
  id?: string;
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  ariaLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
}

const MAX_RESULTADOS = 30;

function normalizar(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Select con búsqueda en vivo: a diferencia de un <select> nativo, permite
 * escribir y filtra las coincidencias al vuelo -- necesario en catálogos
 * grandes (cientos/miles de productos) donde desplazarse por una lista plana
 * deja de ser viable. El filtrado es en memoria (las opciones ya están
 * cargadas), así que no hace falta debounce ni ida y vuelta al servidor.
 */
export function SearchSelect({ id, options, value, onChange, placeholder, emptyLabel = 'Sin resultados', ariaLabel, disabled, invalid }: SearchSelectProps) {
  const [query, setQuery] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const seleccionada = options.find((o) => o.value === value);

  useEffect(() => {
    function alHacerClickFuera(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setAbierto(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', alHacerClickFuera);
    return () => document.removeEventListener('mousedown', alHacerClickFuera);
  }, []);

  const resultados = useMemo(() => {
    const objetivo = normalizar(query);
    const filtradas = objetivo
      ? options.filter((o) => normalizar(o.label).includes(objetivo) || (o.busqueda && normalizar(o.busqueda).includes(objetivo)))
      : options;
    return filtradas.slice(0, MAX_RESULTADOS);
  }, [options, query]);

  function seleccionar(opcion: SearchSelectOption) {
    onChange(opcion.value);
    setQuery('');
    setAbierto(false);
  }

  function alPresionarTecla(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setAbierto(false);
      setQuery('');
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAbierto(true);
      setResaltado((i) => Math.min(i + 1, resultados.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setResaltado((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const opcion = resultados[resaltado];
      if (opcion) seleccionar(opcion);
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.inputRow}>
        <input
          id={id}
          className={formStyles.control}
          value={abierto ? query : (seleccionada?.label ?? '')}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          disabled={disabled}
          onFocus={() => {
            setAbierto(true);
            setQuery('');
            setResaltado(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setResaltado(0);
            if (!abierto) setAbierto(true);
          }}
          onKeyDown={alPresionarTecla}
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
      </div>

      {abierto && (
        <ul className={styles.dropdown} role="listbox">
          {resultados.length === 0 && <li className={styles.empty}>{emptyLabel}</li>}
          {resultados.map((opcion, i) => (
            <li
              key={opcion.value}
              role="option"
              aria-selected={opcion.value === value}
              className={i === resaltado ? styles.optionResaltada : styles.option}
              onMouseEnter={() => setResaltado(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                seleccionar(opcion);
              }}
            >
              {opcion.label}
            </li>
          ))}
          {options.length > MAX_RESULTADOS && resultados.length === MAX_RESULTADOS && (
            <li className={styles.hint}>Sigue escribiendo para acotar más los resultados…</li>
          )}
        </ul>
      )}
    </div>
  );
}
