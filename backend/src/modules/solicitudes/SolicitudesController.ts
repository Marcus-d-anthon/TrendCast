import type { Request, Response } from "express";
import { solicitudesService } from "./SolicitudesService";
import { crearSolicitudSchema, idParamSchema, listarSolicitudesQuerySchema, rechazarSolicitudSchema } from "./SolicitudesValidators";

export const solicitudesController = {
  async listar(req: Request, res: Response): Promise<void> {
    const filtros = listarSolicitudesQuerySchema.parse(req.query);
    // BODEGA solo ve las solicitudes que ella misma creo; Gerencia,
    // Supervisor y Admin ven todas (son quienes las aprueban/gestionan).
    const solicitanteId = req.usuario!.rol === "BODEGA" ? req.usuario!.id : undefined;
    const solicitudes = await solicitudesService.listar({ ...filtros, solicitanteId });
    res.status(200).json({ data: solicitudes });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearSolicitudSchema.parse(req.body);
    const solicitud = await solicitudesService.crear(req.usuario!.id, input);
    res.status(201).json({ data: solicitud });
  },

  async aprobar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const solicitud = await solicitudesService.aprobar(id, req.usuario!.id);
    res.status(200).json({ data: solicitud });
  },

  async rechazar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const { motivo } = rechazarSolicitudSchema.parse(req.body);
    const solicitud = await solicitudesService.rechazar(id, req.usuario!.id, motivo);
    res.status(200).json({ data: solicitud });
  },

  async efectuar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const solicitud = await solicitudesService.efectuar(id, req.usuario!.id);
    res.status(200).json({ data: solicitud });
  },
};
