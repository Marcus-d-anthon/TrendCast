import type { Request, Response } from "express";
import { proveedoresService } from "./proveedores.service";
import { actualizarProveedorSchema, crearProveedorSchema, idParamSchema } from "./proveedores.validators";

export const proveedoresController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const proveedores = await proveedoresService.listar();
    res.status(200).json({ data: proveedores });
  },

  async obtener(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const proveedor = await proveedoresService.obtener(id);
    res.status(200).json({ data: proveedor });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearProveedorSchema.parse(req.body);
    const proveedor = await proveedoresService.crear(input);
    res.status(201).json({ data: proveedor });
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    const input = actualizarProveedorSchema.parse(req.body);
    const proveedor = await proveedoresService.actualizar(id, input);
    res.status(200).json({ data: proveedor });
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    const { id } = idParamSchema.parse(req.params);
    await proveedoresService.eliminar(id);
    res.status(204).send();
  },
};
