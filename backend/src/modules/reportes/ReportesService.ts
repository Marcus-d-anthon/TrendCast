import type { Granularidad } from "../../lib/granularidad";
import type { TablaExport } from "./ReportesExport";
import { reportesRepository } from "./ReportesRepository";

const UMBRAL_CLASE_A = 0.8;
const UMBRAL_CLASE_B = 0.95;
const VENTANA_ROTACION_DIAS = 90;

export const reportesService = {
  async existencias() {
    const productos = await reportesRepository.existencias();

    const detalle = productos.map((producto) => {
      const cantidad = producto.stocks.reduce((suma, s) => suma + s.cantidad, 0);
      const precioUnitario = Number(producto.precioVenta);
      const precioCompra = Number(producto.precioCompra);
      const margenPorcentual = precioUnitario > 0 ? (precioUnitario - precioCompra) / precioUnitario : 0;
      return {
        productoId: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        categoria: producto.categoria.nombre,
        cantidad,
        precioUnitario,
        precioCompra,
        margenPorcentual,
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

  async tablaExistencias(): Promise<TablaExport> {
    const { detalle } = await this.existencias();
    return {
      titulo: "Existencias de inventario",
      columnas: [
        { header: "SKU", key: "sku", ancho: 16 },
        { header: "Producto", key: "nombre", ancho: 32 },
        { header: "Categoria", key: "categoria", ancho: 20 },
        { header: "Cantidad", key: "cantidad", ancho: 12 },
        { header: "Precio unitario", key: "precioUnitario", ancho: 16 },
        { header: "Valor total", key: "valorTotal", ancho: 16 },
      ],
      filas: detalle,
    };
  },

  async tablaRotacion(desde?: Date, hasta?: Date): Promise<TablaExport> {
    const filas = await this.rotacion(desde, hasta);
    return {
      titulo: "Rotacion de inventario",
      columnas: [
        { header: "SKU", key: "sku", ancho: 16 },
        { header: "Producto", key: "nombre", ancho: 32 },
        { header: "Entradas", key: "entradas", ancho: 14 },
        { header: "Salidas", key: "salidas", ancho: 14 },
        { header: "Ajustes", key: "ajustes", ancho: 14 },
      ],
      filas,
    };
  },

  // KPIs para el dashboard ejecutivo. Reutiliza existencias() y rotacion(),
  // que ya leen datos reales del inventario -- no introduce una fuente de
  // datos nueva ni metricas estimadas fuera de lo que el sistema ya calcula.
  async dashboardEjecutivo() {
    const { detalle, totalProductos, totalUnidades, valorTotalInventario } = await this.existencias();

    const margenBrutoPromedio =
      detalle.length > 0 ? detalle.reduce((acumulado, item) => acumulado + item.margenPorcentual, 0) / detalle.length : 0;

    // Curva ABC: se ordena por valor descendente y se clasifica cada
    // producto segun el porcentaje acumulado ANTES de sumarlo (80% -> A,
    // siguiente 15% -> B, resto -> C). Se usa el acumulado previo, no el
    // resultante, para que el producto que hace cruzar un umbral quede en la
    // clase donde arranca su aporte (p. ej. un unico producto que representa
    // el 100% del valor debe ser A, no C).
    const ordenados = [...detalle].sort((a, b) => b.valorTotal - a.valorTotal);
    let acumulado = 0;
    const curvaAbc = ordenados.map((item) => {
      const porcentajeAntes = valorTotalInventario > 0 ? acumulado / valorTotalInventario : 0;
      const clase = porcentajeAntes < UMBRAL_CLASE_A ? "A" : porcentajeAntes < UMBRAL_CLASE_B ? "B" : "C";
      acumulado += item.valorTotal;
      const porcentajeAcumulado = valorTotalInventario > 0 ? acumulado / valorTotalInventario : 0;
      return {
        productoId: item.productoId,
        sku: item.sku,
        nombre: item.nombre,
        valorTotal: item.valorTotal,
        porcentajeAcumulado: Number(porcentajeAcumulado.toFixed(4)),
        clase,
      };
    });
    const resumenAbc = {
      A: curvaAbc.filter((i) => i.clase === "A").length,
      B: curvaAbc.filter((i) => i.clase === "B").length,
      C: curvaAbc.filter((i) => i.clase === "C").length,
    };

    const hasta = new Date();
    const desde = new Date(hasta.getTime() - VENTANA_ROTACION_DIAS * 24 * 60 * 60 * 1000);
    const filasRotacion = await this.rotacion(desde, hasta);
    const totalSalidasVentana = filasRotacion.reduce((acumuladoSalidas, fila) => acumuladoSalidas + fila.salidas, 0);
    const rotacionInventario = totalUnidades > 0 ? Number((totalSalidasVentana / totalUnidades).toFixed(2)) : 0;

    return {
      valorTotalInventario,
      totalProductos,
      totalUnidades,
      margenBrutoPromedio: Number(margenBrutoPromedio.toFixed(4)),
      rotacionInventario,
      ventanaRotacionDias: VENTANA_ROTACION_DIAS,
      curvaAbc,
      resumenAbc,
    };
  },
};
