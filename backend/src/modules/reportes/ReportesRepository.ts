import { obtenerEmpresaActiva } from "../../lib/async-context";
import { TRUNC_UNIDAD, type Granularidad } from "../../lib/granularidad";
import { prisma } from "../../lib/prisma";

interface FilaMovimientoPeriodo {
  periodo: Date;
  tipo: string;
  total: string | number | bigint;
}

export const reportesRepository = {
  async existencias() {
    return prisma.producto.findMany({
      where: { deletedAt: null, activo: true, empresaId: obtenerEmpresaActiva() },
      include: { categoria: true, stocks: true },
      orderBy: { nombre: "asc" },
    });
  },

  async rotacion(desde: Date | undefined, hasta: Date | undefined) {
    const empresaId = obtenerEmpresaActiva();
    // MovimientoInventario no tiene empresa_id propia: el filtro de relacion
    // dentro de groupBy.where es la unica forma de acotar este agregado.
    const agrupado = await prisma.movimientoInventario.groupBy({
      by: ["productoId", "tipo"],
      where: { fecha: { gte: desde, lte: hasta }, producto: { empresaId } },
      _sum: { cantidad: true },
    });

    const productoIds = [...new Set(agrupado.map((fila) => fila.productoId))];
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds }, empresaId },
      select: { id: true, sku: true, nombre: true },
    });

    return { agrupado, productos };
  },

  // Agrupa TODOS los tipos de movimiento por periodo (no solo SALIDA como en
  // el modulo predictivo): sirve para graficar actividad general del libro
  // de inventario a lo largo del tiempo. movimientos_inventario no tiene
  // empresa_id propia, asi que el filtro de empresa entra via JOIN a
  // productos en vez de un WHERE directo.
  async movimientosPorPeriodo(granularidad: Granularidad, desde: Date, hasta: Date): Promise<FilaMovimientoPeriodo[]> {
    const unidad = TRUNC_UNIDAD[granularidad];
    const empresaId = obtenerEmpresaActiva();

    return prisma.$queryRaw<FilaMovimientoPeriodo[]>`
      SELECT date_trunc(${unidad}, mi.fecha) AS periodo, mi.tipo, SUM(mi.cantidad) AS total
      FROM movimientos_inventario mi
      JOIN productos p ON p.id = mi.producto_id
      WHERE mi.fecha >= ${desde} AND mi.fecha <= ${hasta} AND p.empresa_id = ${empresaId}
      GROUP BY periodo, mi.tipo
      ORDER BY periodo ASC
    `;
  },
};
