import type { Request, Response } from "express";
import { auditoriaService } from "./AuditoriaService";
import { listarAuditoriaQuerySchema } from "./AuditoriaValidators";

export const auditoriaController = {
  async listar(req: Request, res: Response): Promise<void> {
    const { entidad, registroId } = listarAuditoriaQuerySchema.parse(req.query);
    const registros = await auditoriaService.listarPorRegistro(entidad, registroId);
    res.status(200).json({ data: registros });
  },
};
