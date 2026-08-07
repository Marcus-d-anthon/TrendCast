import { useState } from 'react';
import { ApiError } from '../../api/http-client';
import type { FormatoExport } from '../../api/types/domain';
import { Button } from './Button';
import styles from './ExportButtons.module.css';
import { toast } from './toast';

interface ExportButtonsProps {
  onExportar: (formato: FormatoExport) => Promise<void>;
  className?: string;
}

const FORMATOS: { value: FormatoExport; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export function ExportButtons({ onExportar, className }: ExportButtonsProps) {
  const [cargando, setCargando] = useState<FormatoExport | null>(null);

  async function manejarClick(formato: FormatoExport) {
    setCargando(formato);
    try {
      await onExportar(formato);
      toast.success(`Descarga en ${formato.toUpperCase()} lista`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo generar el archivo');
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className={[styles.grupo, className].filter(Boolean).join(' ')}>
      <span className={styles.etiqueta}>Exportar</span>
      {FORMATOS.map((f) => (
        <Button
          key={f.value}
          type="button"
          variant="secondary"
          size="sm"
          disabled={cargando !== null}
          onClick={() => manejarClick(f.value)}
        >
          {cargando === f.value ? '…' : f.label}
        </Button>
      ))}
    </div>
  );
}
