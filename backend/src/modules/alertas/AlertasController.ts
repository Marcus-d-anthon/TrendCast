import type { Request, Response } from "express";
import { alertasService } from "./alertas.service";
import { idParamSchema } from "./alertas.validators";

export const alertasController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const alertas = await alertasService.listar();
    res.status(200).json({ data: alertas });
  },

  async listarPersistidas(_req: Request, res: Response): Promise<void> {
    const alertas = await alertasService.listarPersistidas();
    res.status(200).json({ data: alertas });
  },

  async resolver(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const alerta = await alertasService.resolver(id);
    res.status(200).json({ data: alerta });
  },
};
