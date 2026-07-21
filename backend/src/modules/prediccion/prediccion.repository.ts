import { TRUNC_UNIDAD, type Granularidad } from "../../lib/granularidad";
import { prisma } from "../../lib/prisma";

export type { Granularidad };

export interface PuntoDemanda {
  periodo: Date;
  demanda: number;
}

interface FilaDemandaCruda {
  periodo: Date;
  demanda: string | number | bigint;
}

export const prediccionRepository = {
  // Agrupa las SALIDAS historicas del producto por periodo. date_trunc
  // recibe la unidad como parametro normal (no interpolacion de string),
  // asi que $queryRaw la parametriza de forma segura igual que producto_id.
  async obtenerDemandaHistorica(productoId: string, granularidad: Granularidad): Promise<PuntoDemanda[]> {
    const unidad = TRUNC_UNIDAD[granularidad];

    const filas = await prisma.$queryRaw<FilaDemandaCruda[]>`
      SELECT date_trunc(${unidad}, fecha) AS periodo, SUM(cantidad) AS demanda
      FROM movimientos_inventario
      WHERE producto_id = ${productoId} AND tipo = 'SALIDA'
      GROUP BY periodo
      ORDER BY periodo ASC
    `;

    return filas.map((fila) => ({ periodo: fila.periodo, demanda: Number(fila.demanda) }));
  },
};
