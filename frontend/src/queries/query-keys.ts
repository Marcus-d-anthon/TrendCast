import type { ListarAuditoriaParams } from '../api/endpoints/auditoria';
import type { ListarErroresParams } from '../api/endpoints/errores';
import type { ListarComprasPaginadoParams } from '../api/endpoints/compras';
import type { ListarSolicitudesParams } from '../api/endpoints/solicitudes';
import type { ListarMovimientosParams, ListarMovimientosPaginadoParams } from '../api/endpoints/movimientos';
import type { ListarProductosPaginadoParams } from '../api/endpoints/productos';
import type { ListarVentasPaginadoParams } from '../api/endpoints/ventas';
import type { PrediccionParams } from '../api/endpoints/prediccion';
import type { RangoFechas } from '../api/endpoints/reportes';
import type { Granularidad } from '../api/types/domain';

export const queryKeys = {
  productos: ['productos'] as const,
  productosPaginado: (params: ListarProductosPaginadoParams) => ['productos', 'paginado', params] as const,
  producto: (id: string) => ['productos', id] as const,
  categorias: ['categorias'] as const,
  marcas: ['marcas'] as const,
  unidadesMedida: ['unidades-medida'] as const,
  almacenes: ['almacenes'] as const,
  clientes: ['clientes'] as const,
  proveedores: ['proveedores'] as const,
  compras: ['compras'] as const,
  comprasPaginado: (params: ListarComprasPaginadoParams) => ['compras', 'paginado', params] as const,
  compra: (id: string) => ['compras', id] as const,
  ventas: ['ventas'] as const,
  ventasPaginado: (params: ListarVentasPaginadoParams) => ['ventas', 'paginado', params] as const,
  venta: (id: string) => ['ventas', id] as const,
  movimientos: (params: ListarMovimientosParams) => ['movimientos', params] as const,
  movimientosPaginado: (params: ListarMovimientosPaginadoParams) => ['movimientos', 'paginado', params] as const,
  alertas: ['alertas'] as const,
  prediccion: (productoId: string, params: PrediccionParams) => ['prediccion', productoId, params] as const,
  reportesExistencias: ['reportes', 'existencias'] as const,
  reportesRotacion: (params: RangoFechas) => ['reportes', 'rotacion', params] as const,
  reportesMovimientosPorPeriodo: (params: RangoFechas & { granularidad?: Granularidad }) =>
    ['reportes', 'movimientos-por-periodo', params] as const,
  reportesDashboard: ['reportes', 'dashboard'] as const,
  usuarios: ['usuarios'] as const,
  adminEmpresas: ['admin', 'empresas'] as const,
  adminUsuarios: ['admin', 'usuarios'] as const,
  solicitudes: (params: ListarSolicitudesParams) => ['solicitudes', params] as const,
  auditoria: (params: ListarAuditoriaParams) => ['auditoria', params] as const,
  errores: (params: ListarErroresParams) => ['errores', params] as const,
};
