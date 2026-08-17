import { CheckCircle2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Devolucion, EstadoDocumentoComercial, TipoDevolucion } from '../../api/types/domain';
import { ApiError } from '../../api/http-client';
import { usePermiso } from '../../auth/usePermiso';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { toast } from '../../components/ui/toast';
import { useConfirmarDevolucion, useDevolucionesPaginado } from '../../queries/useDevoluciones';
import { formatDateTime } from '../../utils/format';
import styles from './DevolucionesListPage.module.css';

const ESTADO_VARIANT: Record<EstadoDocumentoComercial, 'success' | 'warning' | 'danger'> = {
  BORRADOR: 'warning',
  CONFIRMADA: 'success',
  ANULADA: 'danger',
};

const ESTADO_LABEL: Record<EstadoDocumentoComercial, string> = {
  BORRADOR: 'Borrador',
  CONFIRMADA: 'Confirmada',
  ANULADA: 'Anulada',
};

const TIPO_LABEL: Record<TipoDevolucion, string> = {
  CLIENTE: 'Cliente',
  PROVEEDOR: 'Proveedor',
};

export function DevolucionesListPage() {
  const puedeConfirmar = usePermiso('devoluciones.editar');

  const [estado, setEstado] = useState<EstadoDocumentoComercial | ''>('');
  const [tipo, setTipo] = useState<TipoDevolucion | ''>('');
  const [pagina, setPagina] = useState(1);
  const [confirmando, setConfirmando] = useState<Devolucion | null>(null);

  const devoluciones = useDevolucionesPaginado({
    page: pagina,
    estado: estado || undefined,
    tipo: tipo || undefined,
  });
  const confirmar = useConfirmarDevolucion(confirmando?.id ?? '');

  function conFiltro<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPagina(1);
      setter(v);
    };
  }

  const filas = devoluciones.data?.data ?? [];
  const meta = devoluciones.data?.meta;

  return (
    <div>
      <FiltersCard>
        <FormField label="Estado" htmlFor="dev-filtro-estado" hint="Borrador o confirmada">
          <Select
            id="dev-filtro-estado"
            value={estado}
            onChange={(e) => conFiltro(setEstado)(e.target.value as EstadoDocumentoComercial | '')}
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="CONFIRMADA">Confirmada</option>
          </Select>
        </FormField>
        <FormField label="Tipo" htmlFor="dev-filtro-tipo" hint="Devuelta por cliente o a proveedor">
          <Select id="dev-filtro-tipo" value={tipo} onChange={(e) => conFiltro(setTipo)(e.target.value as TipoDevolucion | '')}>
            <option value="">Todos los tipos</option>
            <option value="CLIENTE">Cliente</option>
            <option value="PROVEEDOR">Proveedor</option>
          </Select>
        </FormField>
      </FiltersCard>

      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Devoluciones de cliente y a proveedor. Se registran desde el detalle de la venta o compra de origen.
        </p>
      </div>

      <Card>
        {devoluciones.isLoading && <Skeleton height="16rem" />}
        {devoluciones.isError && <ErrorState onRetry={() => devoluciones.refetch()} />}
        {devoluciones.data && filas.length === 0 && (
          <EmptyState icon={Undo2} title="Sin devoluciones" description="Ninguna devolución coincide con los filtros aplicados." />
        )}
        {filas.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Documento origen</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Cantidad</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filas.map((dev) => {
                  const documentoOrigen =
                    dev.tipo === 'CLIENTE'
                      ? dev.venta && { to: `/ventas/${dev.venta.id}`, numero: dev.venta.numero }
                      : dev.compra && { to: `/compras/${dev.compra.id}`, numero: dev.compra.numero };
                  return (
                    <tr key={dev.id}>
                      <td className={tableStyles.mono}>{dev.numero}</td>
                      <td>{TIPO_LABEL[dev.tipo]}</td>
                      <td>
                        {documentoOrigen ? (
                          <Link to={documentoOrigen.to} className={styles.enlaceOrigen}>
                            {documentoOrigen.numero}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={tableStyles.mono}>{formatDateTime(dev.fecha)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {dev.detalle.reduce((suma, linea) => suma + linea.cantidad, 0)}
                      </td>
                      <td>
                        <Badge variant={ESTADO_VARIANT[dev.estado]}>{ESTADO_LABEL[dev.estado]}</Badge>
                      </td>
                      <td>
                        {puedeConfirmar && dev.estado === 'BORRADOR' && (
                          <button type="button" className={styles.accionBoton} onClick={() => setConfirmando(dev)}>
                            <CheckCircle2 size={14} aria-hidden="true" /> Confirmar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <Pagination pagina={meta.page} totalPaginas={meta.totalPaginas} totalItems={meta.total} onCambiarPagina={setPagina} />
        )}
      </Card>

      {confirmando && (
        <ConfirmDialog
          title="Confirmar devolución"
          message={`Se generará un movimiento real de inventario por cada línea de "${confirmando.numero}" y el stock del almacén cambiará de inmediato. Esta acción no se puede deshacer.`}
          confirmLabel="Confirmar"
          loading={confirmar.isPending}
          onClose={() => setConfirmando(null)}
          onConfirm={async () => {
            try {
              await confirmar.mutateAsync();
              toast.success('Devolución confirmada: stock actualizado');
              setConfirmando(null);
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'No se pudo confirmar la devolución');
            }
          }}
        />
      )}
    </div>
  );
}
