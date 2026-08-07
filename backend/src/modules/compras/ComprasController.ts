import type { Request, Response } from "express";
import { comprasService } from "./compras.service";
import { crearCompraSchema, idParamSchema } from "./compras.validators";

export const comprasController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const compras = await comprasService.listar();
    res.status(200).json({ data: compras });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const compra = await comprasService.obtener(id);
    res.status(200).json({ data: compra });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearCompraSchema.parse(req.body);
    const compra = await comprasService.crear(req.usuario!.id, input);
    res.status(201).json({ data: compra });
  },

  async confirmar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const compra = await comprasService.confirmar(id, req.usuario!.id);
    res.status(200).json({ data: compra });
  },

  async anular(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const compra = await comprasService.anular(id);
    res.status(200).json({ data: compra });
  },
};
