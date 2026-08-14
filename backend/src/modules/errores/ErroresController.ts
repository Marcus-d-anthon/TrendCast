import type { Request, Response } from "express";
import { erroresService } from "./ErroresService";
import { listarErroresQuerySchema } from "./ErroresValidators";

export const erroresController = {
  async listar(req: Request, res: Response): Promise<void> {
    const filtros = listarErroresQuerySchema.parse(req.query);
    const resultado = await erroresService.listar(filtros);
    res.status(200).json({ data: resultado.registros, meta: { total: resultado.total, limite: resultado.limite } });
  },
};
