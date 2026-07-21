import { PackageCheck, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import tableStyles from '../../components/ui/Table.module.css';
import { useAlertas } from '../../queries/useAlertas';
import { formatNumber } from '../../utils/format';
import { RegistrarMovimientoDrawer } from '../movimientos/RegistrarMovimientoDrawer';

export function AlertasPage() {
  const alertas = useAlertas();
  const [registrandoParaProducto, setRegistrandoParaProducto] = useState<string | null>(null);

  return (
    <div>
      <Card>
        {alertas.isLoading && <Skeleton height="16rem" />}
        {alertas.isError && <ErrorState onRetry={() => alertas.refetch()} />}
        {alertas.data && alertas.data.length === 0 && (
          <EmptyState
            icon={PackageCheck}
            title="Todo en orden"
            description="Ningún producto está en o por debajo de su stock mínimo."
          />
        )}
        {alertas.data && alertas.data.length > 0 && (
          <div className={tableStyles.tableWrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'right' }}>Stock actual</th>
                  <th style={{ textAlign: 'right' }}>Mínimo</th>
                  <th>Faltante</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {alertas.data.map((alerta) => (
                  <tr key={alerta.productoId}>
                    <td className={tableStyles.mono}>{alerta.sku}</td>
                    <td>{alerta.nombre}</td>
                    <td>{alerta.categoria}</td>
                    <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                      {formatNumber(alerta.stockActual)}
                    </td>
                    <td className={tableStyles.mono} style={{ textAlign: 'right' }}>
                      {formatNumber(alerta.stockMinimo)}
                    </td>
                    <td>
                      <Badge variant="danger">Faltan {formatNumber(alerta.unidadesFaltantes)}</Badge>
                    </td>
                    <td>
                      <div className={tableStyles.actionsCell}>
                        <button
                          type="button"
                          className={tableStyles.iconButton}
                          onClick={() => setRegistrandoParaProducto(alerta.productoId)}
                          aria-label={`Registrar entrada de ${alerta.nombre}`}
                          title="Registrar entrada"
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {registrandoParaProducto && (
        <RegistrarMovimientoDrawer
          productoIdInicial={registrandoParaProducto}
          onClose={() => setRegistrandoParaProducto(null)}
        />
      )}
    </div>
  );
}
