import type { Request, Response } from "express";
import { productosService } from "./productos.service";
import { actualizarProductoSchema, crearProductoSchema, idParamSchema } from "./productos.validators";

export const productosController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const productos = await productosService.listar();
    res.status(200).json({ data: productos });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const producto = await productosService.obtener(id);
    res.status(200).json({ data: producto });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearProductoSchema.parse(req.body);
    const producto = await productosService.crear(input);
    res.status(201).json({ data: producto });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarProductoSchema.parse(req.body);
    const producto = await productosService.actualizar(id, input);
    res.status(200).json({ data: producto });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await productosService.eliminar(id);
    res.status(204).send();
  },
};
