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
      where: { deletedAt: null, activo: true },
      include: { categoria: true, stocks: true },
      orderBy: { nombre: "asc" },
    });
  },

  async rotacion(desde: Date | undefined, hasta: Date | undefined) {
    const agrupado = await prisma.movimientoInventario.groupBy({
      by: ["productoId", "tipo"],
      where: { fecha: { gte: desde, lte: hasta } },
      _sum: { cantidad: true },
    });

    const productoIds = [...new Set(agrupado.map((fila) => fila.productoId))];
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true, sku: true, nombre: true },
    });

    return { agrupado, productos };
  },

  // Agrupa TODOS los tipos de movimiento por periodo (no solo SALIDA como en
  // el modulo predictivo): sirve para graficar actividad general del libro
  // de inventario a lo largo del tiempo.
  async movimientosPorPeriodo(granularidad: Granularidad, desde: Date, hasta: Date): Promise<FilaMovimientoPeriodo[]> {
    const unidad = TRUNC_UNIDAD[granularidad];

    return prisma.$queryRaw<FilaMovimientoPeriodo[]>`
      SELECT date_trunc(${unidad}, fecha) AS periodo, tipo, SUM(cantidad) AS total
      FROM movimientos_inventario
      WHERE fecha >= ${desde} AND fecha <= ${hasta}
      GROUP BY periodo, tipo
      ORDER BY periodo ASC
    `;
  },
};
