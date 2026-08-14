import { Plus, ShoppingCart } from 'lucide-react';
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
import { useComprasPaginado } from '../../queries/useCompras';
import { formatCurrency, formatDate, rangoFechasDefecto } from '../../utils/format';
import { CompraFormDrawer } from './CompraFormDrawer';

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

export function ComprasListPage() {
  const puedeCrear = usePermiso('compras.crear');
  const navigate = useNavigate();

  const [estado, setEstado] = useState<EstadoDocumentoComercial | ''>('');
  const [desde, setDesde] = useState(RANGO_DEFECTO.desde);
  const [hasta, setHasta] = useState(RANGO_DEFECTO.hasta);
  const [pagina, setPagina] = useState(1);
  const [creando, setCreando] = useState(false);

  const compras = useComprasPaginado({
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

  const filas = compras.data?.data ?? [];
  const meta = compras.data?.meta;

  return (
    <div>
      <FiltersCard>
        <FormField label="Estado" htmlFor="com-estado" hint="Borrador, confirmada o anulada">
          <Select id="com-estado" value={estado} onChange={(e) => conFiltro(setEstado)(e.target.value as EstadoDocumentoComercial | '')}>
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="ANULADA">Anulada</option>
          </Select>
        </FormField>
        <FormField label="Fecha inicio" htmlFor="com-desde" hint="Por defecto, 2 días atrás">
          <Input id="com-desde" type="date" value={desde} onChange={(e) => conFiltro(setDesde)(e.target.value)} />
        </FormField>
        <FormField label="Fecha fin" htmlFor="com-hasta" hint="Por defecto, hoy">
          <Input id="com-hasta" type="date" value={hasta} onChange={(e) => conFiltro(setHasta)(e.target.value)} />
        </FormField>
      </FiltersCard>

      <div className={tableStyles.toolbar}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Órdenes de compra a proveedores. Confirmar una compra genera el ingreso real de stock.
        </p>
        {puedeCrear && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} aria-hidden="true" /> Nueva compra
          </Button>
        )}
      </div>

      <Card>
        {compras.isLoading && <Skeleton height="16rem" />}
        {compras.isError && <ErrorState onRetry={() => compras.refetch()} />}
        {compras.data && filas.length === 0 && (
          <EmptyState
            icon={ShoppingCart}
            title="Sin compras"
            description="Ninguna compra coincide con los filtros aplicados."
          />
        )}
        {filas.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Proveedor</th>
                  <th>Almacén</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((compra) => (
                  <tr
                    key={compra.id}
                    className={tableStyles.clickable}
                    onClick={() => navigate(`/compras/${compra.id}`)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ver detalle de la compra ${compra.numero}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/compras/${compra.id}`);
                      }
                    }}
                  >
                    <td className={tableStyles.mono}>{compra.numero}</td>
                    <td>{compra.proveedor?.razonSocial ?? '—'}</td>
                    <td>{compra.almacen?.nombre ?? '—'}</td>
                    <td>{formatDate(compra.fecha)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(Number(compra.total))}
                    </td>
                    <td>
                      <Badge variant={ESTADO_VARIANT[compra.estado]}>{ESTADO_LABEL[compra.estado]}</Badge>
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

      {creando && <CompraFormDrawer onClose={() => setCreando(false)} />}
    </div>
  );
}
