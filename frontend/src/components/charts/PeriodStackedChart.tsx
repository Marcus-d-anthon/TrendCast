import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Granularidad, MovimientosPorPeriodoItem } from '../../api/types/domain';
import { formatNumber, formatPeriodo } from '../../utils/format';
import { ChartLimitNote, MAX_PUNTOS_GRAFICO } from './ChartLimitNote';
import { ChartTooltip } from './ChartTooltip';
import styles from './DemandForecastChart.module.css';

interface PeriodStackedChartProps {
  datos: MovimientosPorPeriodoItem[];
  granularidad: Granularidad;
}

const NOMBRE_TIPO: Record<string, string> = {
  ENTRADA: 'Entradas',
  SALIDA: 'Salidas',
  AJUSTE: 'Ajustes',
  TRANSFERENCIA: 'Transferencias',
};
const COLOR_TIPO: Record<string, string> = {
  ENTRADA: 'var(--chart-series-1)',
  SALIDA: 'var(--chart-series-2)',
  AJUSTE: 'var(--chart-series-3)',
  TRANSFERENCIA: 'var(--chart-series-4)',
};

interface FilaPeriodo {
  periodo: string;
  ENTRADA: number;
  SALIDA: number;
  AJUSTE: number;
  TRANSFERENCIA: number;
}

export function PeriodStackedChart({ datos, granularidad }: PeriodStackedChartProps) {
  const { filas, total } = useMemo(() => {
    const porPeriodo = new Map<string, FilaPeriodo>();
    for (const item of datos) {
      const etiqueta = formatPeriodo(item.periodo, granularidad);
      const fila = porPeriodo.get(etiqueta) ?? { periodo: etiqueta, ENTRADA: 0, SALIDA: 0, AJUSTE: 0, TRANSFERENCIA: 0 };
      fila[item.tipo] += item.total;
      porPeriodo.set(etiqueta, fila);
    }
    // Mas recientes primero (el orden de insercion ya es cronologico), y solo
    // los ultimos N periodos -- un rango de fechas amplio con granularidad
    // diaria puede generar cientos de barras finas e ilegibles.
    const todas = Array.from(porPeriodo.values());
    return { filas: todas.slice(-MAX_PUNTOS_GRAFICO), total: todas.length };
  }, [datos, granularidad]);

  return (
    <div>
      <div className={styles.wrap}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="periodo"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              cursor={{ fill: 'var(--color-bg)' }}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  title={label}
                  entries={(payload ?? []).map((p) => ({
                    color: p.color as string,
                    label: NOMBRE_TIPO[p.name as string] ?? String(p.name),
                    value: formatNumber(Number(p.value)),
                  }))}
                />
              )}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
              formatter={(value) => NOMBRE_TIPO[value] ?? value}
            />
            <Bar dataKey="ENTRADA" fill={COLOR_TIPO.ENTRADA} radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="SALIDA" fill={COLOR_TIPO.SALIDA} radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="AJUSTE" fill={COLOR_TIPO.AJUSTE} radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="TRANSFERENCIA" fill={COLOR_TIPO.TRANSFERENCIA} radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLimitNote total={total} mostrados={filas.length} />
    </div>
  );
}
