import type { Request, Response } from "express";
import { categoriasService } from "./categorias.service";
import { actualizarCategoriaSchema, crearCategoriaSchema, idParamSchema } from "./categorias.validators";

export const categoriasController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const categorias = await categoriasService.listar();
    res.status(200).json({ data: categorias });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const categoria = await categoriasService.obtener(id);
    res.status(200).json({ data: categoria });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearCategoriaSchema.parse(req.body);
    const categoria = await categoriasService.crear(input);
    res.status(201).json({ data: categoria });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarCategoriaSchema.parse(req.body);
    const categoria = await categoriasService.actualizar(id, input);
    res.status(200).json({ data: categoria });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await categoriasService.eliminar(id);
    res.status(204).send();
  },
};
