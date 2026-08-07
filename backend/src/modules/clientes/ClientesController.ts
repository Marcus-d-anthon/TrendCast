import type { Request, Response } from "express";
import { clientesService } from "./ClientesService";
import { actualizarClienteSchema, crearClienteSchema, idParamSchema } from "./ClientesValidators";

export const clientesController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const clientes = await clientesService.listar();
    res.status(200).json({ data: clientes });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const cliente = await clientesService.obtener(id);
    res.status(200).json({ data: cliente });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearClienteSchema.parse(req.body);
    const cliente = await clientesService.crear(input);
    res.status(201).json({ data: cliente });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarClienteSchema.parse(req.body);
    const cliente = await clientesService.actualizar(id, input);
    res.status(200).json({ data: cliente });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await clientesService.eliminar(id);
    res.status(204).send();
  },
};
