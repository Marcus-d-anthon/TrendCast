import { CheckCircle2, PackageCheck, Plus, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { EstadoSolicitud, Solicitud } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { usePermiso } from '../../auth/usePermiso';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from '../../components/ui/toast';
import tableStyles from '../../components/ui/Table.module.css';
import { useAprobarSolicitud, useEfectuarSolicitud, useRechazarSolicitud, useSolicitudes } from '../../queries/useSolicitudes';
import { formatDateTime } from '../../utils/format';
import { NuevaSolicitudDrawer } from './NuevaSolicitudDrawer';
import styles from './SolicitudesPage.module.css';

const ESTADO_VARIANT: Record<EstadoSolicitud, 'warning' | 'success' | 'danger' | 'info'> = {
  PENDIENTE: 'warning',
  APROBADA: 'info',
  RECHAZADA: 'danger',
  EFECTUADA: 'success',
};
const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  EFECTUADA: 'Efectuada',
};
const TIPO_LABEL: Record<string, string> = {
  REABASTECIMIENTO: 'Reabastecimiento',
  VENTA_ESPECIAL: 'Venta especial',
};

export function SolicitudesPage() {
  const [estado, setEstado] = useState<EstadoSolicitud | ''>('');
  const [creando, setCreando] = useState(false);
  const [aprobando, setAprobando] = useState<Solicitud | null>(null);
  const [rechazando, setRechazando] = useState<Solicitud | null>(null);
  const [efectuando, setEfectuando] = useState<Solicitud | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const solicitudes = useSolicitudes({ estado: estado || undefined });
  const aprobar = useAprobarSolicitud();
  const rechazar = useRechazarSolicitud();
  const efectuar = useEfectuarSolicitud();

  const puedeAprobar = usePermiso('solicitudes.aprobar');
  const puedeEfectuar = usePermiso('solicitudes.efectuar');

  const filas = solicitudes.data ?? [];

  return (
    <div>
      <FiltersCard>
        <FormField label="Estado" htmlFor="sol-filtro-estado" hint="Filtra por el estado de la solicitud">
          <Select id="sol-filtro-estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoSolicitud | '')}>
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
            <option value="EFECTUADA">Efectuada</option>
          </Select>
        </FormField>
      </FiltersCard>

      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Solicitudes de reabastecimiento y venta especial.
        </p>
        <Button onClick={() => setCreando(true)}>
          <Plus size={16} aria-hidden="true" /> Nueva solicitud
        </Button>
      </div>

      <Card>
        {solicitudes.isLoading && <Skeleton height="16rem" />}
        {solicitudes.isError && <ErrorState onRetry={() => solicitudes.refetch()} />}
        {solicitudes.data && filas.length === 0 && (
          <EmptyState title="Sin solicitudes" description="Ninguna solicitud coincide con el filtro aplicado." />
        )}
        {filas.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={`${tableStyles.table} ${styles.tabla}`}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Almacén</th>
                  <th>Cantidad</th>
                  <th>Solicitante</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filas.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td className={tableStyles.mono}>{solicitud.numero ?? '—'}</td>
                    <td>{TIPO_LABEL[solicitud.tipo] ?? solicitud.tipo}</td>
                    <td>{solicitud.producto.nombre}</td>
                    <td>{solicitud.almacen.nombre}</td>
                    <td className={tableStyles.mono}>{solicitud.cantidad}</td>
                    <td>{solicitud.solicitante.nombre}</td>
                    <td className={tableStyles.mono}>{formatDateTime(solicitud.createdAt)}</td>
                    <td>
                      <Badge variant={ESTADO_VARIANT[solicitud.estado]}>{ESTADO_LABEL[solicitud.estado]}</Badge>
                    </td>
                    <td>
                      <div className={styles.acciones}>
                        {puedeAprobar && solicitud.estado === 'PENDIENTE' && (
                          <>
                            <button type="button" className={styles.accionBoton} onClick={() => setAprobando(solicitud)}>
                              <CheckCircle2 size={14} aria-hidden="true" /> Aprobar
                            </button>
                            <button
                              type="button"
                              className={`${styles.accionBoton} ${styles.accionBotonDanger}`}
                              onClick={() => setRechazando(solicitud)}
                            >
                              <XCircle size={14} aria-hidden="true" /> Rechazar
                            </button>
                          </>
                        )}
                        {puedeEfectuar && solicitud.estado === 'APROBADA' && (
                          <button type="button" className={styles.accionBoton} onClick={() => setEfectuando(solicitud)}>
                            <PackageCheck size={14} aria-hidden="true" /> Efectuar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creando && <NuevaSolicitudDrawer onClose={() => setCreando(false)} />}

      {aprobando && (
        <ConfirmDialog
          title="Aprobar solicitud"
          message={`Se aprobará la solicitud de ${TIPO_LABEL[aprobando.tipo] ?? aprobando.tipo} de "${aprobando.producto.nombre}" (${aprobando.cantidad} unidades). Quedará lista para que Supervisión la efectúe.`}
          confirmLabel="Aprobar"
          loading={aprobar.isPending}
          onClose={() => setAprobando(null)}
          onConfirm={async () => {
            try {
              await aprobar.mutateAsync(aprobando.id);
              toast.success('Solicitud aprobada');
              setAprobando(null);
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'No se pudo aprobar la solicitud');
            }
          }}
        />
      )}

      {rechazando && (
        <ConfirmDialog
          title="Rechazar solicitud"
          message={`Se rechazará la solicitud de ${TIPO_LABEL[rechazando.tipo] ?? rechazando.tipo} de "${rechazando.producto.nombre}". Indica el motivo.`}
          confirmLabel="Rechazar"
          danger
          loading={rechazar.isPending}
          confirmDisabled={motivoRechazo.trim().length < 3}
          onClose={() => {
            setRechazando(null);
            setMotivoRechazo('');
          }}
          onConfirm={async () => {
            try {
              await rechazar.mutateAsync({ id: rechazando.id, motivo: motivoRechazo.trim() });
              toast.success('Solicitud rechazada');
              setRechazando(null);
              setMotivoRechazo('');
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'No se pudo rechazar la solicitud');
            }
          }}
        >
          <FormField label="Motivo" htmlFor="sol-motivo-rechazo">
            <Textarea
              id="sol-motivo-rechazo"
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={3}
              placeholder="Explica por qué se rechaza esta solicitud"
            />
          </FormField>
        </ConfirmDialog>
      )}

      {efectuando && (
        <ConfirmDialog
          title="Efectuar solicitud"
          message={`Se generará un movimiento real de inventario para "${efectuando.producto.nombre}" (${efectuando.cantidad} unidades) en ${efectuando.almacen.nombre}. Esta acción actualiza el stock y no se puede deshacer.`}
          confirmLabel="Efectuar"
          loading={efectuar.isPending}
          onClose={() => setEfectuando(null)}
          onConfirm={async () => {
            try {
              await efectuar.mutateAsync(efectuando.id);
              toast.success('Solicitud efectuada: movimiento de inventario registrado');
              setEfectuando(null);
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'No se pudo efectuar la solicitud');
            }
          }}
        />
      )}
    </div>
  );
}
