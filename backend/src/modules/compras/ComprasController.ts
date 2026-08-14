import type { Request, Response } from "express";
import { comprasService } from "./ComprasService";
import { crearCompraSchema, idParamSchema, listarComprasQuerySchema } from "./ComprasValidators";

export const comprasController = {
  async listar(req: Request, res: Response): Promise<void> {
    if (req.query.page !== undefined) {
      const query = listarComprasQuerySchema.parse(req.query);
      const resultado = await comprasService.listarPaginado(query);
      res.status(200).json(resultado);
      return;
    }
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
