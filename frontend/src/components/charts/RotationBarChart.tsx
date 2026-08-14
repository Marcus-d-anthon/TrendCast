import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RotacionItem } from '../../api/types/domain';
import { formatNumber } from '../../utils/format';
import { ChartLimitNote, MAX_PUNTOS_GRAFICO } from './ChartLimitNote';
import { ChartTooltip } from './ChartTooltip';
import styles from './DemandForecastChart.module.css';

interface RotationBarChartProps {
  datos: RotacionItem[];
}

export function RotationBarChart({ datos }: RotationBarChartProps) {
  const ordenados = [...datos]
    .sort((a, b) => b.entradas + b.salidas - (a.entradas + a.salidas))
    .slice(0, MAX_PUNTOS_GRAFICO);

  return (
    <div>
      <div className={styles.wrap}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordenados} margin={{ top: 16, right: 16, left: 0, bottom: 32 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="sku"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              height={50}
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
                    label: p.name === 'entradas' ? 'Entradas' : 'Salidas',
                    value: formatNumber(Number(p.value)),
                  }))}
                />
              )}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
              formatter={(value) => (value === 'entradas' ? 'Entradas' : 'Salidas')}
            />
            <Bar dataKey="entradas" fill="var(--chart-series-1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="salidas" fill="var(--chart-series-2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLimitNote total={datos.length} mostrados={ordenados.length} />
    </div>
  );
}
