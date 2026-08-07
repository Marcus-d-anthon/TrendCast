import type { Request, Response } from "express";
import { movimientosService } from "./MovimientosService";
import { listarMovimientosQuerySchema, registrarMovimientoSchema } from "./MovimientosValidators";

export const movimientosController = {
  async listar(req: Request, res: Response): Promise<void> {
    const filtros = listarMovimientosQuerySchema.parse(req.query);
    const movimientos = await movimientosService.listar(filtros);
    res.status(200).json({ data: movimientos });
  },

  async registrar(req: Request, res: Response): Promise<void> {
    const input = registrarMovimientoSchema.parse(req.body);
    const movimiento = await movimientosService.registrar(req.usuario!.id, input);
    res.status(201).json({ data: movimiento });
  },
};
