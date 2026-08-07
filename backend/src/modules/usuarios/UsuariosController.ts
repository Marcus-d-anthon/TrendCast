import type { Request, Response } from "express";
import { usuariosService } from "./usuarios.service";
import { crearUsuarioSchema } from "./usuarios.validators";

export const usuariosController = {
  async listar(_req: Request, res: Response): Promise<void> {
    const usuarios = await usuariosService.listar();
    res.status(200).json({ data: usuarios });
  },

  async crear(req: Request, res: Response): Promise<void> {
    const input = crearUsuarioSchema.parse(req.body);
    const usuario = await usuariosService.crear(input);
    res.status(201).json({ data: usuario });
  },
};
