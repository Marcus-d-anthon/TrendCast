import type { Request, Response } from "express";
import { contentTypeExport, generarExport, nombreArchivoExport } from "./ReportesExport";
import { reportesService } from "./ReportesService";
import { exportQuerySchema, movimientosPorPeriodoQuerySchema, rangoFechasQuerySchema } from "./ReportesValidators";

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

  async dashboardEjecutivo(_req: Request, res: Response): Promise<void> {
    const reporte = await reportesService.dashboardEjecutivo();
    res.status(200).json({ data: reporte });
  },

  async existenciasExportar(req: Request, res: Response): Promise<void> {
    const { formato } = exportQuerySchema.parse(req.query);
    const tabla = await reportesService.tablaExistencias();
    const buffer = await generarExport(tabla, formato);
    res.setHeader("Content-Type", contentTypeExport(formato));
    res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivoExport("existencias", formato)}"`);
    res.status(200).send(buffer);
  },

  async rotacionExportar(req: Request, res: Response): Promise<void> {
    const { formato, desde, hasta } = exportQuerySchema.parse(req.query);
    const tabla = await reportesService.tablaRotacion(desde, hasta);
    const buffer = await generarExport(tabla, formato);
    res.setHeader("Content-Type", contentTypeExport(formato));
    res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivoExport("rotacion", formato)}"`);
    res.status(200).send(buffer);
  },
};
