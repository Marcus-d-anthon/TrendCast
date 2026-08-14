import { AlertOctagon, X } from 'lucide-react';
import { useState } from 'react';
import type { ErrorLogRegistro } from '../../api/endpoints/errores';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { useErrores } from '../../queries/useErrores';
import { formatDateTime } from '../../utils/format';
import styles from './ErroresPage.module.css';

// Por defecto, los ultimos 2 dias: suficiente para diagnosticar algo recien
// reportado sin cargar todo el historial de errores en la primera consulta.
function fechaISO(offsetDias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offsetDias);
  return fecha.toISOString().slice(0, 10);
}

export function ErroresPage() {
  const [busquedaCampo, setBusquedaCampo] = useState('');
  const [desdeCampo, setDesdeCampo] = useState(fechaISO(-2));
  const [hastaCampo, setHastaCampo] = useState(fechaISO(0));
  const [filtros, setFiltros] = useState<{ busqueda?: string; desde?: string; hasta?: string }>({
    desde: fechaISO(-2),
    hasta: fechaISO(0),
  });
  const [seleccionado, setSeleccionado] = useState<ErrorLogRegistro | null>(null);

  const errores = useErrores(filtros);
  const filas = errores.data ?? [];

  function buscar() {
    setFiltros({
      busqueda: busquedaCampo.trim() || undefined,
      desde: desdeCampo || undefined,
      hasta: hastaCampo || undefined,
    });
    setSeleccionado(null);
  }

  function limpiar() {
    setBusquedaCampo('');
    setDesdeCampo(fechaISO(-2));
    setHastaCampo(fechaISO(0));
    setFiltros({ desde: fechaISO(-2), hasta: fechaISO(0) });
    setSeleccionado(null);
  }

  return (
    <div>
      <h1 className={styles.titulo}>Errores del sistema</h1>
      <p className={styles.subtitulo}>Registro técnico, visible solo para Super Admin.</p>

      <FiltersCard
        actions={
          <>
            <Button onClick={buscar}>Buscar</Button>
            <Button variant="secondary" onClick={limpiar}>
              Limpiar
            </Button>
          </>
        }
      >
        <FormField label="Buscar" htmlFor="err-busqueda" hint="Mensaje, ruta o Trace ID">
          <Input
            id="err-busqueda"
            value={busquedaCampo}
            onChange={(e) => setBusquedaCampo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            placeholder="Mensaje, ruta, usuario, categoría o Trace ID"
          />
        </FormField>
        <FormField label="Desde" htmlFor="err-desde">
          <Input id="err-desde" type="date" value={desdeCampo} onChange={(e) => setDesdeCampo(e.target.value)} />
        </FormField>
        <FormField label="Hasta" htmlFor="err-hasta">
          <Input id="err-hasta" type="date" value={hastaCampo} onChange={(e) => setHastaCampo(e.target.value)} />
        </FormField>
      </FiltersCard>

      {errores.data && (
        <p className={styles.resumen}>
          {filas.length} resultado{filas.length === 1 ? '' : 's'} · {filas.length} error{filas.length === 1 ? '' : 'es'} recientes
          disponibles
        </p>
      )}

      {errores.isLoading && <Skeleton height="16rem" />}
      {errores.isError && <ErrorState onRetry={() => errores.refetch()} />}
      {errores.data && filas.length === 0 && (
        <EmptyState icon={AlertOctagon} title="Sin errores" description="No se encontraron errores para el filtro aplicado." />
      )}

      <div className={styles.lista}>
        {filas.map((error) => (
          <Card
            key={error.id}
            className={`${styles.fila} ${seleccionado?.id === error.id ? styles.filaActiva : ''}`}
            onClick={() => setSeleccionado(error)}
          >
            <div className={styles.filaInfo}>
              <span className={styles.filaFecha}>{formatDateTime(error.fecha)}</span>
              <strong className={styles.filaMensaje}>{error.mensaje}</strong>
              <span className={styles.filaRuta}>
                {error.metodo} {error.ruta}
              </span>
            </div>
            <Badge variant="danger">Error</Badge>
          </Card>
        ))}
      </div>

      {seleccionado && (
        <Card className={styles.detalle}>
          <div className={styles.detalleHeader}>
            <div>
              <span className={styles.filaFecha}>{formatDateTime(seleccionado.fecha)}</span>
              <strong className={styles.filaMensaje}>{seleccionado.mensaje}</strong>
              <span className={styles.filaRuta}>
                {seleccionado.metodo} {seleccionado.ruta}
              </span>
            </div>
            <button type="button" className={styles.cerrarDetalle} onClick={() => setSeleccionado(null)} aria-label="Cerrar detalle">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.grid}>
            <div>
              <span className={styles.gridLabel}>Categoría</span>
              <span>{seleccionado.categoria ?? '—'}</span>
            </div>
            <div>
              <span className={styles.gridLabel}>Código HTTP</span>
              <span>{seleccionado.statusCode}</span>
            </div>
            <div>
              <span className={styles.gridLabel}>Usuario</span>
              <span>{seleccionado.usuario?.nombre ?? 'Sin sesión'}</span>
            </div>
            <div>
              <span className={styles.gridLabel}>Empresa</span>
              <span>{seleccionado.empresa?.razonSocial ?? '—'}</span>
            </div>
            <div>
              <span className={styles.gridLabel}>IP</span>
              <span>{seleccionado.ip ?? '—'}</span>
            </div>
            <div>
              <span className={styles.gridLabel}>Trace ID</span>
              <span className={styles.traceId}>{seleccionado.traceId}</span>
            </div>
          </div>

          {seleccionado.stackTrace && <pre className={styles.stackTrace}>{seleccionado.stackTrace}</pre>}
        </Card>
      )}
    </div>
  );
}
