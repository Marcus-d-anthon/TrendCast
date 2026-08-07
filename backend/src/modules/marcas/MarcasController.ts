import type { Request, Response } from "express";
import { marcasService } from "./MarcasService";
import { actualizarMarcaSchema, crearMarcaSchema, idParamSchema } from "./MarcasValidators";

export const marcasController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const marcas = await marcasService.listar();
    res.status(200).json({ data: marcas });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const marca = await marcasService.obtener(id);
    res.status(200).json({ data: marca });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearMarcaSchema.parse(req.body);
    const marca = await marcasService.crear(input);
    res.status(201).json({ data: marca });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarMarcaSchema.parse(req.body);
    const marca = await marcasService.actualizar(id, input);
    res.status(200).json({ data: marca });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await marcasService.eliminar(id);
    res.status(204).send();
  },
};
