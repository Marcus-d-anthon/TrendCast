import type { Granularidad } from "../../lib/granularidad";
import { reportesRepository } from "./reportes.repository";

export const reportesService = {
  async existencias() {
    const productos = await reportesRepository.existencias();

    const detalle = productos.map((producto) => {
      const cantidad = producto.stocks.reduce((suma, s) => suma + s.cantidad, 0);
      const precioUnitario = Number(producto.precioVenta);
      return {
        productoId: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        categoria: producto.categoria.nombre,
        cantidad,
        precioUnitario,
        valorTotal: precioUnitario * cantidad,
      };
    });

    return {
      totalProductos: detalle.length,
      totalUnidades: detalle.reduce((acumulado, item) => acumulado + item.cantidad, 0),
      valorTotalInventario: detalle.reduce((acumulado, item) => acumulado + item.valorTotal, 0),
      detalle,
    };
  },

  async rotacion(desde?: Date, hasta?: Date) {
    const { agrupado, productos } = await reportesRepository.rotacion(desde, hasta);
    const productosPorId = new Map(productos.map((producto) => [producto.id, producto]));

    const porProducto = new Map<string, { entradas: number; salidas: number; ajustes: number }>();
    for (const fila of agrupado) {
      const totales = porProducto.get(fila.productoId) ?? { entradas: 0, salidas: 0, ajustes: 0 };
      const cantidad = fila._sum.cantidad ?? 0;
      if (fila.tipo === "ENTRADA") totales.entradas += cantidad;
      else if (fila.tipo === "SALIDA") totales.salidas += cantidad;
      else totales.ajustes += cantidad;
      porProducto.set(fila.productoId, totales);
    }

    return Array.from(porProducto.entries()).map(([productoId, totales]) => {
      const producto = productosPorId.get(productoId);
      return {
        productoId,
        sku: producto?.sku ?? null,
        nombre: producto?.nombre ?? null,
        ...totales,
      };
    });
  },

  async movimientosPorPeriodo(granularidad: Granularidad, desde: Date, hasta: Date) {
    const filas = await reportesRepository.movimientosPorPeriodo(granularidad, desde, hasta);
    return filas.map((fila) => ({
      periodo: fila.periodo,
      tipo: fila.tipo,
      total: Number(fila.total),
    }));
  },
};
