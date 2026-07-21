import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ExistenciasDetalleItem } from '../../api/types/domain';
import { formatCurrency } from '../../utils/format';
import { ChartTooltip } from './ChartTooltip';
import styles from './DemandForecastChart.module.css';

interface CategoryValueChartProps {
  detalle: ExistenciasDetalleItem[];
}

export function CategoryValueChart({ detalle }: CategoryValueChartProps) {
  const datos = useMemo(() => {
    const porCategoria = new Map<string, number>();
    for (const item of detalle) {
      porCategoria.set(item.categoria, (porCategoria.get(item.categoria) ?? 0) + item.valorTotal);
    }
    return Array.from(porCategoria.entries())
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [detalle]);

  return (
    <div className={styles.wrap}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="categoria"
            width={140}
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-bg)' }}
            content={({ active, payload }) => (
              <ChartTooltip
                active={active}
                title={payload?.[0]?.payload?.categoria}
                entries={
                  payload?.[0]
                    ? [{ color: 'var(--chart-series-1)', label: 'Valor', value: formatCurrency(Number(payload[0].value)) }]
                    : []
                }
              />
            )}
          />
          <Bar dataKey="valor" fill="var(--chart-series-1)" radius={[0, 4, 4, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
