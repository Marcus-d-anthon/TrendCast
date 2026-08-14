import type { Request, Response } from "express";
import { ventasService } from "./VentasService";
import { crearVentaSchema, idParamSchema, listarVentasQuerySchema } from "./VentasValidators";

export const ventasController = {
  async listar(req: Request, res: Response): Promise<void> {
    if (req.query.page !== undefined) {
      const query = listarVentasQuerySchema.parse(req.query);
      const resultado = await ventasService.listarPaginado(query);
      res.status(200).json(resultado);
      return;
    }
    const ventas = await ventasService.listar();
    res.status(200).json({ data: ventas });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const venta = await ventasService.obtener(id);
    res.status(200).json({ data: venta });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearVentaSchema.parse(req.body);
    const venta = await ventasService.crear(req.usuario!.id, input);
    res.status(201).json({ data: venta });
  },

  async confirmar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const resultado = await ventasService.confirmar(id, req.usuario!.id);
    res.status(200).json({ data: resultado.venta });
  },

  async anular(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const venta = await ventasService.anular(id);
    res.status(200).json({ data: venta });
  },
};
