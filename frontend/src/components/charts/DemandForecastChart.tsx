import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PrediccionResultado } from '../../api/types/domain';
import { formatNumber, formatPeriodo } from '../../utils/format';
import { ChartLimitNote, MAX_PUNTOS_GRAFICO } from './ChartLimitNote';
import styles from './DemandForecastChart.module.css';

interface ChartPoint {
  etiqueta: string;
  demanda: number | null;
  tendencia: number;
  esProyeccion: boolean;
}

interface DemandForecastChartProps {
  prediccion: PrediccionResultado;
}

function construirDatos(prediccion: PrediccionResultado): { puntos: ChartPoint[]; totalHistorico: number } {
  const { historico, regresionLineal, granularidad } = prediccion;

  // El indice usado para la recta de tendencia (x = indice+1) es el del
  // historico COMPLETO, no del recorte que se muestra: se calcula sobre todo
  // el arreglo y recien despues se corta a los ultimos N puntos, para que la
  // pendiente no cambie solo por mostrar menos barras.
  const todosLosPuntos: ChartPoint[] = historico.map((punto, indice) => ({
    etiqueta: formatPeriodo(punto.periodo, granularidad),
    demanda: punto.demanda,
    tendencia: regresionLineal.interceptoA + regresionLineal.pendienteB * (indice + 1),
    esProyeccion: false,
  }));

  const puntos = todosLosPuntos.slice(-(MAX_PUNTOS_GRAFICO - 1));
  puntos.push({
    etiqueta: 'Proyección',
    demanda: null,
    tendencia: regresionLineal.proyeccionProximoPeriodo,
    esProyeccion: true,
  });

  return { puntos, totalHistorico: historico.length };
}

function TooltipContenido({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const punto: ChartPoint = payload[0]?.payload;
  if (!punto) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {punto.demanda !== null && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: 'var(--chart-series-1)' }} />
          Demanda <span className={styles.tooltipValue}>{formatNumber(punto.demanda)}</span>
        </div>
      )}
      <div className={styles.tooltipRow}>
        <span
          className={styles.tooltipDot}
          style={{ background: punto.esProyeccion ? 'var(--chart-series-3)' : 'var(--chart-series-2)' }}
        />
        {punto.esProyeccion ? 'Proyección' : 'Tendencia'}{' '}
        <span className={styles.tooltipValue}>{formatNumber(Math.round(punto.tendencia))}</span>
      </div>
    </div>
  );
}

function PuntoTendencia(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const color = payload.esProyeccion ? 'var(--chart-series-3)' : 'var(--chart-series-2)';
  const radio = payload.esProyeccion ? 5 : 3;
  return (
    <g>
      <circle cx={cx} cy={cy} r={radio} fill={color} stroke="var(--chart-surface)" strokeWidth={2} />
      {payload.esProyeccion && (
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={color}>
          {formatNumber(Math.round(payload.tendencia))}
        </text>
      )}
    </g>
  );
}

export function DemandForecastChart({ prediccion }: DemandForecastChartProps) {
  const { puntos, totalHistorico } = construirDatos(prediccion);

  return (
    <div>
      <div className={styles.wrap}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={puntos} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<TooltipContenido />} cursor={{ fill: 'var(--color-bg)' }} />
            <Bar dataKey="demanda" fill="var(--chart-series-1)" radius={[4, 4, 0, 0]} maxBarSize={32} name="Demanda" />
            <Line
              dataKey="tendencia"
              stroke="var(--chart-series-2)"
              strokeWidth={2}
              dot={<PuntoTendencia />}
              activeDot={false}
              name="Tendencia"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLimitNote total={totalHistorico} mostrados={puntos.length - 1} />
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: 'var(--chart-series-1)' }} /> Demanda histórica
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: 'var(--chart-series-2)' }} /> Tendencia (regresión
          lineal)
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} style={{ background: 'var(--chart-series-3)' }} /> Proyección
        </span>
      </div>
    </div>
  );
}
