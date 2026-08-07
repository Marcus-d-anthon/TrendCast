import { useSearchParams } from 'react-router-dom';
import type { Granularidad, PrediccionResultado } from '../../api/types/domain';
import { DemandForecastChart } from '../../components/charts/DemandForecastChart';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { usePrediccion } from '../../queries/usePrediccion';
import { useProductos } from '../../queries/useProductos';
import { formatNumber } from '../../utils/format';
import styles from './PrediccionPage.module.css';

const GRANULARIDAD_LABEL: Record<Granularidad, string> = { diaria: 'día', semanal: 'semana', mensual: 'mes' };
const GRANULARIDAD_LABEL_PLURAL: Record<Granularidad, string> = { diaria: 'días', semanal: 'semanas', mensual: 'meses' };

// Traduce los dos métodos estadísticos (SMA + regresión lineal, ver
// prediccion.math.ts en el backend) a una explicación en lenguaje natural:
// qué pasó, por qué la proyección es la que es, y qué tan de acuerdo están
// los dos métodos entre sí. Es la respuesta directa a la observación de los
// pares ciegos de "profundizar el análisis predictivo... explicando
// limitaciones e indicadores de precisión" -- sin inventar un modelo nuevo.
function construirExplicacion(data: PrediccionResultado) {
  const unidad = GRANULARIDAD_LABEL[data.granularidad];
  const periodosConDatos = data.historico.length;
  const promedioHistorico =
    periodosConDatos > 0 ? data.historico.reduce((suma, p) => suma + p.demanda, 0) / periodosConDatos : 0;

  const pendiente = data.regresionLineal.pendienteB;
  const umbralTendencia = Math.max(0.5, promedioHistorico * 0.05);
  const tendencia = pendiente > umbralTendencia ? 'ascendente' : pendiente < -umbralTendencia ? 'descendente' : 'estable';

  const proySma = data.promedioMovil.proyeccionProximoPeriodo;
  const proyReg = data.regresionLineal.proyeccionProximoPeriodo;
  const diferenciaRelativa = promedioHistorico > 0 ? Math.abs(proySma - proyReg) / promedioHistorico : 0;
  const metodosCoinciden = diferenciaRelativa < 0.15;

  const faltante = Math.max(0, data.recomendacionReabastecimiento);

  return {
    queOcurrio: `En los últimos ${periodosConDatos} ${periodosConDatos === 1 ? unidad : GRANULARIDAD_LABEL_PLURAL[data.granularidad]} con salidas registradas, la demanda promedio fue de ${formatNumber(Math.round(promedioHistorico))} unidades por ${unidad}, con una tendencia ${tendencia} (pendiente de ${pendiente >= 0 ? '+' : ''}${pendiente.toFixed(2)} unidades por ${unidad} según la regresión lineal).`,
    queProyecta: metodosCoinciden
      ? `El promedio móvil y la regresión lineal coinciden razonablemente (${formatNumber(Math.round(proySma))} y ${formatNumber(Math.round(proyReg))} unidades respectivamente), lo que da mayor confianza a la proyección para el siguiente ${unidad}.`
      : `El promedio móvil (${formatNumber(Math.round(proySma))} unidades) y la regresión lineal (${formatNumber(Math.round(proyReg))} unidades) difieren de forma notable, lo que indica que la demanda reciente se está apartando del comportamiento histórico promedio; conviene priorizar la regresión lineal si la tendencia ${tendencia} se mantiene, o el promedio móvil si se espera que la demanda vuelva a estabilizarse.`,
    queRecomienda:
      faltante > 0
        ? `Con un stock actual de ${formatNumber(data.stockActual)} unidades y un mínimo configurado de ${formatNumber(data.stockMinimo)}, el sistema recomienda reponer ${formatNumber(faltante)} unidades para cubrir la demanda proyectada sin caer por debajo del mínimo.`
        : `El stock actual (${formatNumber(data.stockActual)} unidades) cubre la demanda proyectada y el mínimo configurado (${formatNumber(data.stockMinimo)}), por lo que no se recomienda reposición inmediata.`,
    limitaciones:
      'Esta proyección usa promedio móvil simple y regresión lineal sobre el historial real de salidas del producto: no incorpora estacionalidad, promociones ni eventos externos, y su precisión mejora cuantos más períodos de historial existan. Es una estimación de apoyo a la decisión, no una predicción garantizada.',
  };
}

const GRANULARIDADES: { value: Granularidad; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'diaria', label: 'Diaria' },
];

export function PrediccionPage() {
  const [params, setParams] = useSearchParams();
  const productoId = params.get('producto') ?? '';
  const periodos = Number(params.get('periodos') ?? 6);
  const granularidad = (params.get('granularidad') as Granularidad) ?? 'mensual';

  const productos = useProductos();
  const prediccion = usePrediccion(productoId || undefined, { periodos, granularidad });

  function actualizarParam(clave: string, valor: string) {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    setParams(siguiente, { replace: true });
  }

  return (
    <div>
      <div className={styles.controls}>
        <Select
          className={styles.controlInput}
          value={productoId}
          onChange={(e) => actualizarParam('producto', e.target.value)}
          aria-label="Producto"
        >
          <option value="">Selecciona un producto</option>
          {productos.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} · {p.nombre}
            </option>
          ))}
        </Select>
        <Select
          className={styles.narrowInput}
          value={granularidad}
          onChange={(e) => actualizarParam('granularidad', e.target.value)}
          aria-label="Granularidad"
        >
          {GRANULARIDADES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
        <Select
          className={styles.narrowInput}
          value={String(periodos)}
          onChange={(e) => actualizarParam('periodos', e.target.value)}
          aria-label="Períodos"
        >
          {[3, 6, 12, 24].map((n) => (
            <option key={n} value={n}>
              Últimos {n} períodos
            </option>
          ))}
        </Select>
      </div>

      {!productoId && (
        <Card>
          <EmptyState title="Selecciona un producto" description="Elige un producto para ver su proyección de demanda." />
        </Card>
      )}

      {productoId && prediccion.isLoading && <Skeleton height="24rem" />}
      {productoId && prediccion.isError && <ErrorState onRetry={() => prediccion.refetch()} />}

      {productoId && prediccion.data && (
        <div className={styles.grid}>
          <Card>
            <h2 style={{ marginBottom: 'var(--space-1)' }}>{prediccion.data.nombre}</h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              {prediccion.data.sku}
            </p>
            {prediccion.data.historico.length === 0 ? (
              <EmptyState title="Sin historial de salidas" description="Este producto todavía no tiene movimientos de tipo SALIDA para proyectar." />
            ) : (
              <DemandForecastChart prediccion={prediccion.data} />
            )}
          </Card>

          <div>
            <div className={styles.recommendationCard}>
              <div className={styles.recommendationLabel}>Recomendación de reabastecimiento</div>
              <div className={styles.recommendationValue}>{formatNumber(prediccion.data.recomendacionReabastecimiento)} unidades</div>
              <div className={styles.recommendationHint}>
                Cubre la demanda proyectada + stock mínimo, descontando el stock actual.
              </div>
            </div>

            <Card className={styles.statCard}>
              <div className={styles.statLabel}>Promedio móvil (ventana {prediccion.data.promedioMovil.ventana})</div>
              <div className={styles.statValue}>{formatNumber(Math.round(prediccion.data.promedioMovil.proyeccionProximoPeriodo))}</div>
              <div className={styles.statHint}>Proyección del próximo período por promedio simple</div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statLabel}>Regresión lineal</div>
              <div className={styles.statValue}>{formatNumber(Math.round(prediccion.data.regresionLineal.proyeccionProximoPeriodo))}</div>
              <div className={styles.statHint}>
                Pendiente {prediccion.data.regresionLineal.pendienteB >= 0 ? '+' : ''}
                {prediccion.data.regresionLineal.pendienteB.toFixed(2)} por período
              </div>
            </Card>

            <Card className={styles.statCard}>
              <div className={styles.statLabel}>Stock actual vs. mínimo</div>
              <div className={styles.statValue}>
                {formatNumber(prediccion.data.stockActual)} / {formatNumber(prediccion.data.stockMinimo)}
              </div>
            </Card>
          </div>
        </div>
      )}

      {productoId && prediccion.data && prediccion.data.historico.length > 0 && (
        <Card className={styles.explanationCard}>
          <h3 className={styles.explanationTitle}>¿Cómo se calculó esta proyección?</h3>
          {(() => {
            const exp = construirExplicacion(prediccion.data);
            return (
              <>
                <p className={styles.explanationParagraph}>
                  <strong>Qué ocurrió: </strong>
                  {exp.queOcurrio}
                </p>
                <p className={styles.explanationParagraph}>
                  <strong>Qué proyecta el sistema: </strong>
                  {exp.queProyecta}
                </p>
                <p className={styles.explanationParagraph}>
                  <strong>Qué recomienda: </strong>
                  {exp.queRecomienda}
                </p>
                <p className={styles.explanationLimitations}>{exp.limitaciones}</p>
              </>
            );
          })()}
        </Card>
      )}
    </div>
  );
}
