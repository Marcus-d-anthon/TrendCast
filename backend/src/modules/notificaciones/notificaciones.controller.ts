import type { Request, Response } from "express";
import { notificacionesService } from "./notificaciones.service";
import { idParamSchema } from "./notificaciones.validators";

export const notificacionesController = {
  async listar(req: Request, res: Response): Promise<void> {
    const notificaciones = await notificacionesService.listar(req.usuario!.id);
    res.status(200).json({ data: notificaciones });
  },

  async contarNoLeidas(req: Request, res: Response): Promise<void> {
    const total = await notificacionesService.contarNoLeidas(req.usuario!.id);
    res.status(200).json({ data: { total } });
  },

  async marcarLeida(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const notificacion = await notificacionesService.marcarLeida(id, req.usuario!.id);
    res.status(200).json({ data: notificacion });
  },
};
