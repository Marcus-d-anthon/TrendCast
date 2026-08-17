export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Marca {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  activo: boolean;
}

export interface Almacen {
  id: string;
  nombre: string;
  direccion: string | null;
  activo: boolean;
}

export interface StockPorAlmacen {
  id: string;
  cantidad: number;
  almacenId: string;
  almacen?: Almacen;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  precioCompra: string;
  precioVenta: string;
  stockMinimo: number;
  requiereLote: boolean;
  activo: boolean;
  categoriaId: string;
  marcaId: string;
  unidadMedidaId: string;
  categoria?: Categoria;
  marca?: Marca;
  unidadMedida?: UnidadMedida;
  stocks?: StockPorAlmacen[];
}

export type TipoDocumento = 'CEDULA' | 'RUC' | 'PASAPORTE';

export interface Cliente {
  id: string;
  codigo: string | null;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface Proveedor {
  id: string;
  codigo: string | null;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

export type EstadoDocumentoComercial = 'BORRADOR' | 'CONFIRMADA' | 'ANULADA';

export interface DetalleDocumentoProducto {
  id: string;
  sku: string;
  nombre: string;
  stockMinimo?: number;
}

export interface DetalleCompra {
  id: string;
  cantidad: number;
  precioUnitario: string;
  subtotal: string;
  productoId: string;
  producto?: DetalleDocumentoProducto;
}

export interface Compra {
  id: string;
  numero: string;
  fecha: string;
  estado: EstadoDocumentoComercial;
  subtotal: string;
  impuesto: string;
  total: string;
  proveedorId: string;
  almacenId: string;
  usuarioId: string;
  proveedor?: Proveedor;
  almacen?: Almacen;
  usuario?: { id: string; nombre: string; email: string };
  detalle: DetalleCompra[];
}

export interface DetalleVenta {
  id: string;
  cantidad: number;
  precioUnitario: string;
  subtotal: string;
  productoId: string;
  producto?: DetalleDocumentoProducto;
}

export interface Venta {
  id: string;
  numero: string;
  fecha: string;
  estado: EstadoDocumentoComercial;
  subtotal: string;
  impuesto: string;
  total: string;
  clienteId: string;
  almacenId: string;
  usuarioId: string;
  cliente?: Cliente;
  almacen?: Almacen;
  usuario?: { id: string; nombre: string; email: string };
  detalle: DetalleVenta[];
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA' | 'DEVOLUCION_CLIENTE' | 'DEVOLUCION_PROVEEDOR';

export type TipoDevolucion = 'CLIENTE' | 'PROVEEDOR';

export interface DetalleDevolucion {
  id: string;
  cantidad: number;
  productoId: string;
  producto?: DetalleDocumentoProducto;
}

export interface Devolucion {
  id: string;
  numero: string;
  tipo: TipoDevolucion;
  fecha: string;
  estado: EstadoDocumentoComercial;
  motivo: string;
  ventaId: string | null;
  compraId: string | null;
  almacenId: string;
  usuarioId: string;
  venta?: { id: string; numero: string } | null;
  compra?: { id: string; numero: string } | null;
  almacen?: Almacen;
  usuario?: { id: string; nombre: string; email: string };
  detalle: DetalleDevolucion[];
}

export interface MovimientoUsuario {
  id: string;
  nombre: string;
  email: string;
}

export interface MovimientoProducto {
  id: string;
  sku: string;
  nombre: string;
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  saldoResultante: number;
  referencia: string | null;
  motivo: string | null;
  productoId: string;
  almacenId: string;
  usuarioId: string;
  movimientoOrigenId: string | null;
  fecha: string;
  producto?: MovimientoProducto;
  almacen?: Almacen;
  usuario?: MovimientoUsuario;
}

export interface Alerta {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  unidadesFaltantes: number;
}

export interface ExistenciasDetalleItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  valorTotal: number;
}

export interface ExistenciasReporte {
  totalProductos: number;
  totalUnidades: number;
  valorTotalInventario: number;
  detalle: ExistenciasDetalleItem[];
}

export interface RotacionItem {
  productoId: string;
  sku: string | null;
  nombre: string | null;
  entradas: number;
  salidas: number;
  ajustes: number;
}

export interface MovimientosPorPeriodoItem {
  periodo: string;
  tipo: TipoMovimiento;
  total: number;
}

export interface CurvaAbcItem {
  productoId: string;
  sku: string | null;
  nombre: string | null;
  valorTotal: number;
  porcentajeAcumulado: number;
  clase: 'A' | 'B' | 'C';
}

export interface DashboardEjecutivo {
  valorTotalInventario: number;
  totalProductos: number;
  totalUnidades: number;
  margenBrutoPromedio: number;
  rotacionInventario: number;
  ventanaRotacionDias: number;
  curvaAbc: CurvaAbcItem[];
  resumenAbc: { A: number; B: number; C: number };
}

export type FormatoExport = 'csv' | 'excel' | 'pdf';

export type Granularidad = 'diaria' | 'semanal' | 'mensual';

export interface PrediccionHistoricoPunto {
  periodo: string;
  demanda: number;
}

export interface PrediccionResultado {
  productoId: string;
  sku: string;
  nombre: string;
  granularidad: Granularidad;
  historico: PrediccionHistoricoPunto[];
  promedioMovil: { ventana: number; proyeccionProximoPeriodo: number };
  regresionLineal: { interceptoA: number; pendienteB: number; proyeccionProximoPeriodo: number };
  stockActual: number;
  stockMinimo: number;
  recomendacionReabastecimiento: number;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'BODEGA' | 'VENTAS' | 'GERENCIA' | 'SUPERUSUARIO';
  activo: boolean;
  almacenId?: string | null;
}

export type TipoSolicitud = 'REABASTECIMIENTO' | 'VENTA_ESPECIAL';
export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EFECTUADA';

export interface Solicitud {
  id: string;
  numero: string | null;
  tipo: TipoSolicitud;
  estado: EstadoSolicitud;
  cantidad: number;
  comentario: string | null;
  producto: { id: string; sku: string; nombre: string };
  almacen: { id: string; nombre: string };
  solicitante: { id: string; nombre: string; email: string };
  aprobador: { id: string; nombre: string; email: string } | null;
  fechaAprobacion: string | null;
  motivoRechazo: string | null;
  efectuador: { id: string; nombre: string; email: string } | null;
  fechaEfectuacion: string | null;
  createdAt: string;
  updatedAt: string;
}
