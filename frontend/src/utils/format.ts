import type { Granularidad } from '../api/types/domain';

// Ecuador usa USD como moneda oficial desde la dolarizacion (2000).
const currencyFormatter = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

const numberFormatter = new Intl.NumberFormat('es-EC');
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

const monthFormatter = new Intl.DateTimeFormat('es-EC', { month: 'short', year: 'numeric' });

export function formatPeriodo(value: string, granularidad: Granularidad): string {
  const date = new Date(value);
  if (granularidad === 'mensual') {
    return monthFormatter.format(date);
  }
  return formatDate(date);
}

function fechaInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Rango de fechas por defecto para filtros: hoy y 2 dias atras, en formato
 * YYYY-MM-DD para inputs `<input type="date">` -- evita que un filtro sin
 * acotar termine trayendo el historico completo desde el servidor.
 */
export function rangoFechasDefecto(): { desde: string; hasta: string } {
  const hoy = new Date();
  const dosDiasAtras = new Date(hoy);
  dosDiasAtras.setDate(hoy.getDate() - 2);
  return { desde: fechaInput(dosDiasAtras), hasta: fechaInput(hoy) };
}
