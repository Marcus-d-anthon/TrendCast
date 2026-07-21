import type { Request, Response } from "express";
import { reportesService } from "./reportes.service";
import { movimientosPorPeriodoQuerySchema, rangoFechasQuerySchema } from "./reportes.validators";

export const reportesController = {
  async existencias(_req: Request, res: Response): Promise<void> {
    const reporte = await reportesService.existencias();
    res.status(200).json({ data: reporte });
  },

  async rotacion(req: Request, res: Response): Promise<void> {
    const { desde, hasta } = rangoFechasQuerySchema.parse(req.query);
    const reporte = await reportesService.rotacion(desde, hasta);
    res.status(200).json({ data: reporte });
  },

  async movimientosPorPeriodo(req: Request, res: Response): Promise<void> {
    const { desde, hasta, granularidad } = movimientosPorPeriodoQuerySchema.parse(req.query);
    const reporte = await reportesService.movimientosPorPeriodo(granularidad, desde, hasta);
    res.status(200).json({ data: reporte });
  },
};
