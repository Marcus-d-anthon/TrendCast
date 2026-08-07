import type { Request, Response } from "express";
import { prediccionService } from "./PrediccionService";
import { prediccionParamsSchema, prediccionQuerySchema } from "./PrediccionValidators";

export const prediccionController = {
  async generar(req: Request, res: Response): Promise<void> {
    const { productoId } = prediccionParamsSchema.parse(req.params);
    const { periodos, granularidad } = prediccionQuerySchema.parse(req.query);
    const resultado = await prediccionService.generar({ productoId, periodos, granularidad });
    res.status(200).json({ data: resultado });
  },
};
