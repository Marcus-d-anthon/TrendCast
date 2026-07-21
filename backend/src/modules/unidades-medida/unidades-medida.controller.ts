import type { Request, Response } from "express";
import { unidadesMedidaService } from "./unidades-medida.service";
import { actualizarUnidadMedidaSchema, crearUnidadMedidaSchema, idParamSchema } from "./unidades-medida.validators";

export const unidadesMedidaController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const unidades = await unidadesMedidaService.listar();
    res.status(200).json({ data: unidades });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const unidad = await unidadesMedidaService.obtener(id);
    res.status(200).json({ data: unidad });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearUnidadMedidaSchema.parse(req.body);
    const unidad = await unidadesMedidaService.crear(input);
    res.status(201).json({ data: unidad });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarUnidadMedidaSchema.parse(req.body);
    const unidad = await unidadesMedidaService.actualizar(id, input);
    res.status(200).json({ data: unidad });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await unidadesMedidaService.eliminar(id);
    res.status(204).send();
  },
};
