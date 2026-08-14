import { Plus, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EstadoDocumentoComercial } from '../../api/types/domain';
import { usePermiso } from '../../auth/usePermiso';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FiltersCard } from '../../components/ui/FiltersCard';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useVentasPaginado } from '../../queries/useVentas';
import { formatCurrency, formatDate, rangoFechasDefecto } from '../../utils/format';
import { VentaFormDrawer } from './VentaFormDrawer';

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

const RANGO_DEFECTO = rangoFechasDefecto();

export function VentasListPage() {
  const puedeCrear = usePermiso('ventas.crear');
  const navigate = useNavigate();

  const [estado, setEstado] = useState<EstadoDocumentoComercial | ''>('');
  const [desde, setDesde] = useState(RANGO_DEFECTO.desde);
  const [hasta, setHasta] = useState(RANGO_DEFECTO.hasta);
  const [pagina, setPagina] = useState(1);
  const [creando, setCreando] = useState(false);

  const ventas = useVentasPaginado({
    page: pagina,
    estado: estado || undefined,
    desde: desde ? `${desde}T00:00:00` : undefined,
    hasta: hasta ? `${hasta}T23:59:59` : undefined,
  });

  function conFiltro<T>(setter: (v: T) => void) {
    return (v: T) => {
      setPagina(1);
      setter(v);
    };
  }

  const filas = ventas.data?.data ?? [];
  const meta = ventas.data?.meta;

  return (
    <div>
      <FiltersCard>
        <FormField label="Estado" htmlFor="ven-estado" hint="Borrador, confirmada o anulada">
          <Select id="ven-estado" value={estado} onChange={(e) => conFiltro(setEstado)(e.target.value as EstadoDocumentoComercial | '')}>
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="ANULADA">Anulada</option>
          </Select>
        </FormField>
        <FormField label="Fecha inicio" htmlFor="ven-desde" hint="Por defecto, 2 días atrás">
          <Input id="ven-desde" type="date" value={desde} onChange={(e) => conFiltro(setDesde)(e.target.value)} />
        </FormField>
        <FormField label="Fecha fin" htmlFor="ven-hasta" hint="Por defecto, hoy">
          <Input id="ven-hasta" type="date" value={hasta} onChange={(e) => conFiltro(setHasta)(e.target.value)} />
        </FormField>
      </FiltersCard>

      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Ventas a clientes. Confirmar una venta genera la salida real de stock.
        </p>
        {puedeCrear && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} aria-hidden="true" /> Nueva venta
          </Button>
        )}
      </div>

      <Card>
        {ventas.isLoading && <Skeleton height="16rem" />}
        {ventas.isError && <ErrorState onRetry={() => ventas.refetch()} />}
        {ventas.data && filas.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Sin ventas"
            description="Ninguna venta coincide con los filtros aplicados."
          />
        )}
        {filas.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Almacén</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((venta) => (
                  <tr
                    key={venta.id}
                    className={tableStyles.clickable}
                    onClick={() => navigate(`/ventas/${venta.id}`)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ver detalle de la venta ${venta.numero}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/ventas/${venta.id}`);
                      }
                    }}
                  >
                    <td className={tableStyles.mono}>{venta.numero}</td>
                    <td>{venta.cliente?.nombre ?? '—'}</td>
                    <td>{venta.almacen?.nombre ?? '—'}</td>
                    <td>{formatDate(venta.fecha)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(Number(venta.total))}
                    </td>
                    <td>
                      <Badge variant={ESTADO_VARIANT[venta.estado]}>{ESTADO_LABEL[venta.estado]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <Pagination
            pagina={meta.page}
            totalPaginas={meta.totalPaginas}
            totalItems={meta.total}
            onCambiarPagina={setPagina}
          />
        )}
      </Card>

      {creando && <VentaFormDrawer onClose={() => setCreando(false)} />}
    </div>
  );
}
