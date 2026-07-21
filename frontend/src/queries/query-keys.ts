import type { ListarMovimientosParams } from '../api/endpoints/movimientos';
import type { PrediccionParams } from '../api/endpoints/prediccion';
import type { RangoFechas } from '../api/endpoints/reportes';
import type { Granularidad } from '../api/types/domain';

export const queryKeys = {
  productos: ['productos'] as const,
  producto: (id: string) => ['productos', id] as const,
  categorias: ['categorias'] as const,
  marcas: ['marcas'] as const,
  unidadesMedida: ['unidades-medida'] as const,
  almacenes: ['almacenes'] as const,
  clientes: ['clientes'] as const,
  proveedores: ['proveedores'] as const,
  compras: ['compras'] as const,
  compra: (id: string) => ['compras', id] as const,
  ventas: ['ventas'] as const,
  venta: (id: string) => ['ventas', id] as const,
  movimientos: (params: ListarMovimientosParams) => ['movimientos', params] as const,
  alertas: ['alertas'] as const,
  prediccion: (productoId: string, params: PrediccionParams) => ['prediccion', productoId, params] as const,
  reportesExistencias: ['reportes', 'existencias'] as const,
  reportesRotacion: (params: RangoFechas) => ['reportes', 'rotacion', params] as const,
  reportesMovimientosPorPeriodo: (params: RangoFechas & { granularidad?: Granularidad }) =>
    ['reportes', 'movimientos-por-periodo', params] as const,
  usuarios: ['usuarios'] as const,
};
