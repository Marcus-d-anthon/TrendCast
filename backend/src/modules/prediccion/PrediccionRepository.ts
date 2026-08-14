import { obtenerEmpresaActiva } from "../../lib/async-context";
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
    const empresaId = obtenerEmpresaActiva();

    // Mismo motivo que ReportesRepository.movimientosPorPeriodo: sin
    // empresa_id propia en movimientos_inventario, el filtro entra via JOIN.
    const filas = await prisma.$queryRaw<FilaDemandaCruda[]>`
      SELECT date_trunc(${unidad}, mi.fecha) AS periodo, SUM(mi.cantidad) AS demanda
      FROM movimientos_inventario mi
      JOIN productos p ON p.id = mi.producto_id
      WHERE mi.producto_id = ${productoId} AND mi.tipo = 'SALIDA' AND p.empresa_id = ${empresaId}
      GROUP BY periodo
      ORDER BY periodo ASC
    `;

    return filas.map((fila) => ({ periodo: fila.periodo, demanda: Number(fila.demanda) }));
  },
};
