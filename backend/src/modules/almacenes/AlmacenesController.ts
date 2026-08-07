import type { Request, Response } from "express";
import { almacenesService } from "./almacenes.service";
import { actualizarAlmacenSchema, crearAlmacenSchema, idParamSchema, transferenciaSchema } from "./almacenes.validators";

export const almacenesController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const almacenes = await almacenesService.listar();
    res.status(200).json({ data: almacenes });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const almacen = await almacenesService.obtener(id);
    res.status(200).json({ data: almacen });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearAlmacenSchema.parse(req.body);
    const almacen = await almacenesService.crear(input);
    res.status(201).json({ data: almacen });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarAlmacenSchema.parse(req.body);
    const almacen = await almacenesService.actualizar(id, input);
    res.status(200).json({ data: almacen });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await almacenesService.eliminar(id);
    res.status(204).send();
  },

  async transferir(req: Request, res: Response): Promise<void> {
    const input = transferenciaSchema.parse(req.body);
    const resultado = await almacenesService.registrarTransferencia(req.usuario!.id, input);
    res.status(201).json({ data: resultado });
  },
};
