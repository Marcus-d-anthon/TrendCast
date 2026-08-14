import { History } from 'lucide-react';
import type { AccionAuditoria, AuditoriaRegistro } from '../../api/endpoints/auditoria';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { useAuditoria } from '../../queries/useAuditoria';
import { formatDateTime } from '../../utils/format';
import styles from './AuditoriaHistorial.module.css';

const ACCION_VARIANT: Record<AccionAuditoria, 'success' | 'info' | 'danger' | 'neutral'> = {
  CREATE: 'success',
  UPDATE: 'info',
  SOFT_DELETE: 'danger',
  LOGIN: 'neutral',
};
const ACCION_LABEL: Record<AccionAuditoria, string> = {
  CREATE: 'Creación',
  UPDATE: 'Edición',
  SOFT_DELETE: 'Baja',
  LOGIN: 'Acceso',
};

// Campos que no aportan nada a un resumen legible (marcas de sistema, datos
// sensibles) -- nunca se muestran, ni siquiera si cambiaron.
const CAMPOS_OCULTOS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'deletedAt',
  'passwordHash',
]);

function camposModificados(anterior: Record<string, unknown> | null, nuevo: Record<string, unknown> | null) {
  if (!anterior || !nuevo) return [];
  const claves = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
  const cambios: { campo: string; de: unknown; a: unknown }[] = [];
  for (const campo of claves) {
    if (CAMPOS_OCULTOS.has(campo)) continue;
    const de = anterior[campo];
    const a = nuevo[campo];
    if (JSON.stringify(de) !== JSON.stringify(a)) {
      cambios.push({ campo, de, a });
    }
  }
  return cambios;
}

function valorLegible(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

interface AuditoriaHistorialProps {
  entidad: string;
  registroId: string;
}

// Historial real de auditoria para UN registro (ya se genera automatico via
// AuditExtension.ts en cada CREATE/UPDATE/SOFT_DELETE -- esta es la primera
// vista que lo muestra). Pensado para montarse dentro de una pantalla de
// detalle ya escopada (ver ProductoDetailPage.tsx): no repite el filtro de
// empresa, confia en que el registroId ya vino de una vista permitida.
export function AuditoriaHistorial({ entidad, registroId }: AuditoriaHistorialProps) {
  const auditoria = useAuditoria({ entidad, registroId });

  if (auditoria.isLoading) return <Skeleton height="10rem" />;
  if (auditoria.isError) return <ErrorState onRetry={() => auditoria.refetch()} />;
  if (auditoria.data && auditoria.data.length === 0) {
    return <EmptyState icon={History} title="Sin historial" description="Todavía no hay cambios registrados para este registro." />;
  }

  return (
    <ul className={styles.timeline}>
      {(auditoria.data ?? []).map((registro: AuditoriaRegistro) => {
        const cambios = registro.accion === 'UPDATE' ? camposModificados(registro.valorAnterior, registro.valorNuevo) : [];
        return (
          <li key={registro.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <Badge variant={ACCION_VARIANT[registro.accion]}>{ACCION_LABEL[registro.accion]}</Badge>
              <span className={styles.fecha}>{formatDateTime(registro.fecha)}</span>
            </div>
            <div className={styles.actor}>{registro.actor?.nombre ?? 'Sistema'}</div>
            {cambios.length > 0 && (
              <ul className={styles.cambios}>
                {cambios.map((c) => (
                  <li key={c.campo}>
                    <span className={styles.campo}>{c.campo}</span>: {valorLegible(c.de)} → {valorLegible(c.a)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
